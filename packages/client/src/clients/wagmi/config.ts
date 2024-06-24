import {
  arbitrum,
  base,
  blast,
  canto,
  linea,
  localhost,
  mantle,
  optimism,
  scroll,
  zkSync,
  zora,
} from '@wagmi/core/chains';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { defaultChain, ethereum } from 'constants/chains';

const mode = import.meta.env.MODE;
const transportUrl = import.meta.env.VITE_RPC_TRANSPORT_URL;
const defaultTransport = mode === 'development' ? http() : http(transportUrl);

export const config = createConfig({
  chains: [
    defaultChain,
    localhost,
    arbitrum,
    base,
    blast,
    canto,
    ethereum,
    linea,
    mantle,
    optimism,
    scroll,
    zkSync,
    zora,
  ],
  transports: {
    [defaultChain.id]: defaultTransport,
    [localhost.id]: defaultTransport,
    [arbitrum.id]: defaultTransport,
    [base.id]: defaultTransport,
    [blast.id]: defaultTransport,
    [canto.id]: defaultTransport,
    [ethereum.id]: defaultTransport,
    [linea.id]: defaultTransport,
    [mantle.id]: defaultTransport,
    [optimism.id]: defaultTransport,
    [scroll.id]: defaultTransport,
    [zkSync.id]: defaultTransport,
    [zora.id]: defaultTransport,
  },
  connectors: [injected()],
  pollingInterval: 1000, // TODO: set this with a config value
});
