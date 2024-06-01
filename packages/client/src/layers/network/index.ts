export type { Components } from './components';
export { createConfig as createNetworkConfig } from './config';
export { createNetworkInstance, createNetworkLayer, updateNetworkLayer } from './create';
export type { NetworkLayer };
import type { NetworkLayer } from './create';
export type Layers = { network: NetworkLayer }; // unpack this?
