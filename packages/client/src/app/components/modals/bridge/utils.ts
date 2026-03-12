import { Contract, JsonRpcProvider, getAddress } from 'ethers';
import { toBigInt } from 'utils/numbers';
import { YOMINET_ETH_TOKEN_ADDRESS, YOMINET_RPC_URL } from './constants';

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
