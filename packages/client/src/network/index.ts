export { createNetworkInstance, createNetworkLayer, updateNetworkLayer } from './create';
export { createConfig as createNetworkConfig } from './setup';

export type { Components } from './components';
export type { NetworkLayer };
import type { NetworkLayer } from './create';
export type Layers = { network: NetworkLayer }; // TODO: unpack this?
