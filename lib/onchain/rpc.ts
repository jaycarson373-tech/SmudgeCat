const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const HEX_PATTERN = /^0x[0-9a-fA-F]*$/;

export type RpcLog = {
  address: string;
  blockNumber: string;
  data: string;
  logIndex: string;
  topics: string[];
  transactionHash: string;
};

type RpcResult<T> = {
  id: number;
  jsonrpc: "2.0";
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

let requestId = 0;

export const RPC_URL =
  process.env.ROBINHOOD_RPC_URL?.trim() ||
  "https://rpc.mainnet.chain.robinhood.com";

export const EXPLORER_URL = (
  process.env.ROBINHOOD_EXPLORER_URL?.trim() ||
  process.env.NEXT_PUBLIC_EXPLORER_URL?.trim() ||
  "https://robinhoodchain.blockscout.com"
).replace(/\/$/, "");

export function isAddress(value: string): boolean {
  return ADDRESS_PATTERN.test(value);
}

export function normalizeAddress(value: string): string {
  return value.toLowerCase();
}

export function configuredVaultAddress(): {
  address: string;
  error: string | null;
} {
  const serverAddress = process.env.BUYBACK_VAULT_ADDRESS?.trim() || "";
  const publicAddress =
    process.env.NEXT_PUBLIC_BUYBACK_VAULT_ADDRESS?.trim() || "";

  if (
    serverAddress &&
    publicAddress &&
    normalizeAddress(serverAddress) !== normalizeAddress(publicAddress)
  ) {
    return {
      address: "",
      error: "Server and public buyback vault addresses do not match.",
    };
  }

  const candidate = serverAddress || publicAddress;

  if (!candidate) return { address: "", error: null };
  if (!isAddress(candidate)) {
    return {
      address: "",
      error: "BUYBACK_VAULT_ADDRESS must be a 20-byte EVM address.",
    };
  }

  return { address: normalizeAddress(candidate), error: null };
}

export function configuredExpectedTokenAddress(): {
  address: string;
  error: string | null;
} {
  const serverAddress = process.env.ZAZU_TOKEN_ADDRESS?.trim() || "";
  const publicAddress = process.env.NEXT_PUBLIC_ZAZU_ADDRESS?.trim() || "";
  if (!serverAddress && !publicAddress) {
    return { address: "", error: "ZAZU_TOKEN_ADDRESS is required." };
  }
  if (
    serverAddress &&
    publicAddress &&
    normalizeAddress(serverAddress) !== normalizeAddress(publicAddress)
  ) {
    return {
      address: "",
      error: "Server and public ZAZU token addresses do not match.",
    };
  }
  const candidate = serverAddress || publicAddress;
  if (!isAddress(candidate)) {
    return {
      address: "",
      error: "ZAZU_TOKEN_ADDRESS must be a 20-byte EVM address.",
    };
  }
  return { address: normalizeAddress(candidate), error: null };
}

export function configuredExpectedChainId(): {
  chainId: bigint | null;
  error: string | null;
} {
  const serverChainId = process.env.CHAIN_ID?.trim() || "";
  const publicChainId = process.env.NEXT_PUBLIC_CHAIN_ID?.trim() || "";
  if (serverChainId && publicChainId && serverChainId !== publicChainId) {
    return { chainId: null, error: "Server and public chain IDs do not match." };
  }
  const candidate = serverChainId || publicChainId;
  if (!/^\d+$/.test(candidate) || BigInt(candidate) <= BigInt(0)) {
    return { chainId: null, error: "CHAIN_ID is required and must be positive." };
  }
  return { chainId: BigInt(candidate), error: null };
}

export async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++requestId,
      method,
      params,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  let payload: RpcResult<T>;
  try {
    payload = (await response.json()) as RpcResult<T>;
  } catch {
    throw new Error(`RPC ${method} returned a non-JSON response.`);
  }

  if (!response.ok || payload.error || payload.result === undefined) {
    throw new Error(
      payload.error?.message || `RPC ${method} failed with HTTP ${response.status}.`,
    );
  }

  return payload.result;
}

export async function ethCall(to: string, data: string): Promise<string> {
  return rpc<string>("eth_call", [{ to, data }, "latest"]);
}

export async function readUint(to: string, selector: string): Promise<bigint> {
  return decodeUint(await ethCall(to, selector));
}

export async function readAddress(
  to: string,
  selector: string,
): Promise<string> {
  return decodeAddress(await ethCall(to, selector));
}

export function decodeUint(value: string): bigint {
  if (!HEX_PATTERN.test(value) || value === "0x") {
    throw new Error("Contract returned an invalid uint256 value.");
  }
  return BigInt(value);
}

export function decodeAddress(value: string): string {
  if (!HEX_PATTERN.test(value) || value.length < 42) {
    throw new Error("Contract returned an invalid address value.");
  }
  const address = `0x${value.slice(-40)}`;
  if (!isAddress(address)) {
    throw new Error("Contract returned an invalid address value.");
  }
  return normalizeAddress(address);
}

export function encodeAddressArgument(address: string): string {
  if (!isAddress(address)) throw new Error("Cannot encode an invalid address.");
  return address.slice(2).toLowerCase().padStart(64, "0");
}

export function encodeUintTopic(value: bigint): string {
  return `0x${value.toString(16).padStart(64, "0")}`;
}

export function decodeTopicAddress(topic: string): string {
  return decodeAddress(topic);
}

export function splitDataWords(data: string): string[] {
  if (!HEX_PATTERN.test(data) || (data.length - 2) % 64 !== 0) {
    throw new Error("Event log contained malformed data.");
  }
  const body = data.slice(2);
  const words: string[] = [];
  for (let offset = 0; offset < body.length; offset += 64) {
    words.push(`0x${body.slice(offset, offset + 64)}`);
  }
  return words;
}

export function formatUnits(value: bigint, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new Error("Token returned an invalid decimals value.");
  }
  if (decimals === 0) return value.toString();

  const base = BigInt(10) ** BigInt(decimals);
  const whole = value / base;
  const remainder = (value % base).toString().padStart(decimals, "0");
  const fraction = remainder.replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function decodeAbiString(value: string): string {
  if (!HEX_PATTERN.test(value) || value === "0x") return "";
  const body = value.slice(2);

  // Some older tokens return bytes32 rather than a dynamic ABI string.
  if (body.length === 64) {
    const bytes = body.match(/.{2}/g) ?? [];
    return bytes
      .map((byte) => Number.parseInt(byte, 16))
      .filter((byte) => byte !== 0)
      .map((byte) => String.fromCharCode(byte))
      .join("")
      .trim();
  }

  if (body.length < 128) return "";
  const offsetValue = BigInt(`0x${body.slice(0, 64)}`);
  if (offsetValue > BigInt(Number.MAX_SAFE_INTEGER)) return "";
  const offset = Number(offsetValue);
  const lengthStart = offset * 2;
  if (lengthStart + 64 > body.length) return "";
  const byteLengthValue = BigInt(
    `0x${body.slice(lengthStart, lengthStart + 64)}`,
  );
  if (byteLengthValue > BigInt(Number.MAX_SAFE_INTEGER)) return "";
  const byteLength = Number(byteLengthValue);
  const dataStart = lengthStart + 64;
  const dataEnd = dataStart + byteLength * 2;
  if (!Number.isSafeInteger(byteLength) || dataEnd > body.length) return "";

  const bytes = body.slice(dataStart, dataEnd).match(/.{2}/g) ?? [];
  return new TextDecoder().decode(
    Uint8Array.from(bytes.map((byte) => Number.parseInt(byte, 16))),
  );
}

export async function readTokenMetadata(token: string): Promise<{
  decimals: number;
  symbol: string;
}> {
  const [decimalsResult, symbolResult] = await Promise.all([
    ethCall(token, "0x313ce567"),
    ethCall(token, "0x95d89b41").catch(() => "0x"),
  ]);
  const decimals = Number(decodeUint(decimalsResult));
  return { decimals, symbol: decodeAbiString(symbolResult) };
}

export function transactionExplorerUrl(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function addressExplorerUrl(address: string): string {
  if (!isAddress(address)) throw new Error("Cannot link an invalid address.");
  return `${EXPLORER_URL}/address/${normalizeAddress(address)}`;
}
