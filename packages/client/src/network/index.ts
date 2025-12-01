export { createNetworkInstance, createNetworkLayer, updateNetworkLayer } from './create';
export { createConfig as createNetworkConfig } from './setup';

export type { Components } from './components';
import type { NetworkLayer } from './create';
export type { NetworkLayer };
export type Layers = { network: NetworkLayer }; // TODO: unpack this?
