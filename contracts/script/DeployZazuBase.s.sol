// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { ZazuToken } from "../src/ZazuToken.sol";
import { BuybackVault } from "../src/BuybackVault.sol";

abstract contract DeployZazuBase is Script {
    address internal constant DEFAULT_BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    struct Deployment {
        address token;
        address vault;
        address deployer;
        address keeper;
        address pendingOwner;
    }

    error ChainIdMismatch(uint256 expected, uint256 actual);
    error RequiredAddressMissing(string variableName);
    error AddressHasNoCode(string variableName, address value);
    error MultisigRequiredForMainnet(address configuredOwner);

    function _deploy(bool mainnet) internal returns (Deployment memory deployment) {
        uint256 expectedChainId = vm.envUint("CHAIN_ID");
        if (block.chainid != expectedChainId) {
            revert ChainIdMismatch(expectedChainId, block.chainid);
        }

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 keeperPrivateKey = vm.envUint("KEEPER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address keeper = vm.addr(keeperPrivateKey);
        address initialOwner = vm.envOr("INITIAL_OWNER", deployer);
        address tokenRecipient = vm.envOr("TOKEN_RECIPIENT", initialOwner);
        uint256 fixedSupply = vm.envOr("FIXED_SUPPLY", uint256(1_000_000_000 ether));
        address existingToken = vm.envOr("ZAZU_TOKEN_ADDRESS", address(0));
        address dexRouter = vm.envAddress("DEX_ROUTER_ADDRESS");
        address wrappedNative = vm.envAddress("WRAPPED_NATIVE_ADDRESS");
        address feeToken = vm.envOr("FEE_TOKEN_ADDRESS", address(0));
        address destination = vm.envOr("BUYBACK_DESTINATION", DEFAULT_BURN_ADDRESS);
        uint256 minAmount = vm.envUint("MIN_EXECUTION_AMOUNT");
        uint256 maxAmount = vm.envUint("MAX_EXECUTION_AMOUNT");
        uint256 slippageBps = vm.envUint("MAX_SLIPPAGE_BPS");
        uint48 timelockDelay = uint48(vm.envOr("CONFIGURATION_DELAY_SECONDS", uint256(1 days)));

        _requireAddress("DEX_ROUTER_ADDRESS", dexRouter);
        _requireAddress("WRAPPED_NATIVE_ADDRESS", wrappedNative);
        _requireAddress("BUYBACK_DESTINATION", destination);
        _requireAddress("INITIAL_OWNER", initialOwner);
        _requireAddress("TOKEN_RECIPIENT", tokenRecipient);
        _requireCode("DEX_ROUTER_ADDRESS", dexRouter);
        _requireCode("WRAPPED_NATIVE_ADDRESS", wrappedNative);
        if (existingToken != address(0)) _requireCode("ZAZU_TOKEN_ADDRESS", existingToken);
        if (feeToken != address(0)) _requireCode("FEE_TOKEN_ADDRESS", feeToken);
        if (mainnet && (initialOwner == deployer || initialOwner.code.length == 0)) {
            revert MultisigRequiredForMainnet(initialOwner);
        }

        vm.startBroadcast(deployerPrivateKey);

        ZazuToken token;
        bool tokenWasDeployed;
        if (existingToken == address(0)) {
            token = new ZazuToken(initialOwner, tokenRecipient, fixedSupply);
            tokenWasDeployed = true;
        } else {
            token = ZazuToken(existingToken);
        }

        BuybackVault vault = new BuybackVault(
            deployer,
            address(token),
            dexRouter,
            wrappedNative,
            feeToken,
            destination,
            keeper,
            minAmount,
            maxAmount,
            slippageBps
        );
        vault.enableConfigurationTimelock(timelockDelay);

        if (initialOwner != deployer) {
            vault.transferOwnership(initialOwner);
        }

        vm.stopBroadcast();

        deployment = Deployment({
            token: address(token),
            vault: address(vault),
            deployer: deployer,
            keeper: keeper,
            pendingOwner: initialOwner == deployer ? address(0) : initialOwner
        });

        console2.log("ZAZU_TOKEN_ADDRESS", deployment.token);
        console2.log("BUYBACK_VAULT_ADDRESS", deployment.vault);
        console2.log("DEPLOYER_ADDRESS", deployment.deployer);
        console2.log("KEEPER_ADDRESS", deployment.keeper);
        if (tokenWasDeployed) {
            console2.log("TOKEN_RECIPIENT", tokenRecipient);
            console2.log("FIXED_SUPPLY", fixedSupply);
        } else {
            console2.log("EXISTING_ZAZU_TOKEN_REUSED", address(token));
        }
        if (initialOwner != deployer) {
            console2.log("PENDING_VAULT_OWNER", initialOwner);
            console2.log("ACTION_REQUIRED: INITIAL_OWNER must accept vault ownership");
        }
    }

    function _requireAddress(string memory variableName, address value) private pure {
        if (value == address(0)) revert RequiredAddressMissing(variableName);
    }

    function _requireCode(string memory variableName, address value) private view {
        if (value.code.length == 0) revert AddressHasNoCode(variableName, value);
    }
}
