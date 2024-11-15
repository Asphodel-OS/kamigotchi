import { PrivyClientConfig } from '@privy-io/react-auth';
import { DefaultChain } from 'constants/chains';

export const config: PrivyClientConfig = {
  supportedChains: [DefaultChain],
  DefaultChain: DefaultChain,
  embeddedWallets: {
    createOnLogin: 'all-users',
    noPromptOnSignature: true,
    waitForTransactionConfirmation: false,
  },
  appearance: {
    theme: 'light',
    accentColor: '#676FFF',
    logo: import.meta.env.VITE_PRIVY_APP_LOGO,
    showWalletLoginFirst: true,
  },
};
