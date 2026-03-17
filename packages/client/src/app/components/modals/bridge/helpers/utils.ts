import { EVMWalletProvider } from './constants';

export const toHexQuantity = (value: bigint) => `0x${value.toString(16)}`;

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
