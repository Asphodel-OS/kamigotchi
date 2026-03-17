import { Contract, JsonRpcProvider, getAddress, id as keccak256 } from 'ethers';
import { toBigInt } from 'utils/numbers';
import { EVMWalletProvider, YOMINET_ETH_TOKEN_ADDRESS, YOMINET_RPC_URL } from './constants';

const providerCache = new Map<string, JsonRpcProvider>();
const yominetEthAbi = ['function balanceOf(address account) view returns (uint256)'];

function getRpcProvider(rpcUrl: string): JsonRpcProvider {
  // putting this here because
  // we are checking balance every 5 seconds
  const cached = providerCache.get(rpcUrl);
  if (cached) return cached;

  const provider = new JsonRpcProvider(rpcUrl);
  providerCache.set(rpcUrl, provider);
  return provider;
}

export const toHexQuantity = (value: bigint) => `0x${value.toString(16)}`;

export type SourceTransactionStatus = 'pending' | 'success' | 'reverted';

export async function getNativeBalance(rpcUrl: string, address: string): Promise<bigint> {
  const provider = getRpcProvider(rpcUrl);
  return provider.getBalance(getAddress(address));
}

export async function getYominetEthBalance(address: string): Promise<bigint> {
  const provider = getRpcProvider(YOMINET_RPC_URL);
  const contract = new Contract(YOMINET_ETH_TOKEN_ADDRESS, yominetEthAbi, provider);
  const balance = await contract.balanceOf(getAddress(address));
  return toBigInt(balance);
}

export async function getSourceTransactionStatus(
  rpcUrl: string,
  txHash: string
): Promise<SourceTransactionStatus> {
  const provider = getRpcProvider(rpcUrl);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt) return 'pending';
  const receiptStatus = Number(receipt.status);
  if (receiptStatus === 1) return 'success';
  if (receiptStatus === 0) return 'reverted';
  return 'pending';
}

// adding this until we know how to check
// tx state from INITIA API
const TRANSFER_EVENT_TOPIC = keccak256('Transfer(address,address,uint256)');
const ZERO_ADDRESS_TOPIC = '0x' + '0'.repeat(64);

export async function getYominetBlockNumber(): Promise<number> {
  const provider = getRpcProvider(YOMINET_RPC_URL);
  return provider.getBlockNumber();
}

export async function hasReceivedYominetEthMintSince(
  address: string,
  fromBlock: number,
  expectedAmount: bigint
): Promise<string | null> {
  const provider = getRpcProvider(YOMINET_RPC_URL);
  const paddedAddress = '0x' + getAddress(address).slice(2).toLowerCase().padStart(64, '0');
  const logs = await provider.getLogs({
    address: YOMINET_ETH_TOKEN_ADDRESS,
    topics: [TRANSFER_EVENT_TOPIC, ZERO_ADDRESS_TOPIC, paddedAddress],
    fromBlock,
    toBlock: 'latest',
  });
  const match = logs.find((log) => BigInt(log.data) === expectedAmount);
  return match?.transactionHash ?? null;
}

////////////////
// ABORT & WALLET

const WALLET_CHAIN_SETTLE_ATTEMPTS = 12;
const WALLET_CHAIN_SETTLE_INTERVAL_MS = 100;

export const createBridgeAbortError = () => {
  const error = new Error('Bridge aborted because the modal was closed.');
  error.name = 'BridgeAbortError';
  return error;
};

export const isBridgeAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'BridgeAbortError';

export async function waitForWalletChain(
  wallet: EVMWalletProvider,
  targetChainId: string
): Promise<void> {
  for (let attempt = 0; attempt < WALLET_CHAIN_SETTLE_ATTEMPTS; attempt++) {
    const currentChainId = await wallet.request({ method: 'eth_chainId' });
    if (currentChainId === targetChainId) return;
    await new Promise((resolve) => window.setTimeout(resolve, WALLET_CHAIN_SETTLE_INTERVAL_MS));
  }
}
