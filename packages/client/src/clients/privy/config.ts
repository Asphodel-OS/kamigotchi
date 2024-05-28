import { PrivyClientConfig } from '@privy-io/react-auth';
import { defaultChain } from 'constants/chains';

export const config: PrivyClientConfig = {
  supportedChains: [defaultChain],
  defaultChain: defaultChain,
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
