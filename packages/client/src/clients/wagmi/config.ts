import { createConfig, http, webSocket } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { DefaultChain } from 'constants/chains';

const mode = import.meta.env.MODE;
const transportUrl = import.meta.env.VITE_RPC_TRANSPORT_URL;
const webSocketUrl = import.meta.env.VITE_RPC_WS_URL;

const httpTransport = mode === 'puter' ? http() : http(transportUrl);
const wsTransport =
  mode === 'puter'
    ? webSocket()
    : webSocket(webSocketUrl, { timeout: 10000, retryDelay: 100, retryCount: 5 });

export const config = createConfig({
  chains: [DefaultChain],
  connectors: [injected()],
  transports: {
    // [DefaultChain.id]: httpTransport,
    [DefaultChain.id]: wsTransport,
  },
  pollingInterval: 5000, // TODO: set this with a config value
});
