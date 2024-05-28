import type { NetworkLayer } from './createNetworkLayer';

export type { Components } from './components';
export { createConfig as createNetworkConfig } from './config';
export { createNetworkLayer } from './createNetworkLayer';
export type { NetworkLayer };
export type Layers = { network: NetworkLayer }; // unpack this?
