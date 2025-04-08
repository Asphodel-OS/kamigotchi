import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { DefaultChain } from 'constants/chains';

const mode = import.meta.env.MODE;
const transportUrl = import.meta.env.VITE_RPC_TRANSPORT_URL;
const defaultTransport = mode === 'puter' ? http() : http(transportUrl);

export const config = createConfig({
  chains: [DefaultChain],
  transports: {
    [DefaultChain.id]: defaultTransport,
  },
  connectors: [injected()],
  pollingInterval: 1000, // TODO: set this with a config value
});
