import type { ConnectedWallet } from '@privy-io/react-auth';
import React from 'react';

import { playClick } from 'utils/sounds';

export type EVMWalletProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

// copy a string to clipboard
export const copy = (str: string) => {
  playClick();
  navigator.clipboard.writeText(str);
};

export const getInjectedWallet = (wallets: ConnectedWallet[]) => {
  return wallets.find((wallet) => wallet.connectorType === 'injected');
};

export const getEvmWalletProvider = async (
  wallet?: Pick<ConnectedWallet, 'getEthereumProvider'>
): Promise<EVMWalletProvider | undefined> => {
  const provider = await wallet?.getEthereumProvider();
  return typeof provider === 'object' &&
    provider !== null &&
    'request' in provider &&
    typeof provider.request === 'function'
    ? (provider as EVMWalletProvider)
    : undefined;
};

// returns which mouse button was clicked
export const mouseBttnClicked = (e: React.MouseEvent<HTMLDivElement>): string => {
  switch (e.button) {
    case 0:
      return 'left';
    case 1:
      return 'middle';
    case 2:
      document.addEventListener('contextmenu', (contextEvent) => contextEvent.preventDefault(), {
        once: true,
      });
      return 'right';
    case 3:
      return 'back';
    case 4:
      return 'forward';
    default:
      return 'unknown';
  }
};
