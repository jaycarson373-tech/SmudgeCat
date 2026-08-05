// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { DeployZazuBase } from "./DeployZazuBase.s.sol";

contract DeployRobinhoodTestnet is DeployZazuBase {
    function run() external returns (Deployment memory) {
        return _deploy(false);
    }
}
