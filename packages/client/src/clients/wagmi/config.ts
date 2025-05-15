import { createConfig, webSocket } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { DefaultChain } from 'constants/chains';

const webSocketUrl = import.meta.env.VITE_RPC_WS_URL;
const wsTransport = webSocket(webSocketUrl, { timeout: 10000, retryDelay: 100, retryCount: 5 });

export const config = createConfig({
  chains: [DefaultChain],
  connectors: [injected()],
  transports: {
    // [DefaultChain.id]: httpTransport,
    [DefaultChain.id]: wsTransport,
  },
  pollingInterval: 5000, // TODO: set this with a config value
});
