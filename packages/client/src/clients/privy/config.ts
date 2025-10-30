import { PrivyClientConfig } from '@privy-io/react-auth';
import { DefaultChain } from 'constants/chains';

export const config: PrivyClientConfig = {
  supportedChains: [DefaultChain],
  defaultChain: DefaultChain,
  loginMethods: ['wallet'],
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'all-users',
    },
    showWalletUIs: false,
  },
  appearance: {
    theme: 'light',
    accentColor: '#676FFF',
    logo: import.meta.env.VITE_PRIVY_APP_LOGO,
    showWalletLoginFirst: true,
    walletChainType: 'ethereum-only',
    walletList: ['detected_ethereum_wallets'],
  },
};
