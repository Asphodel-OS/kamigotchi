import React from 'react';

import { Layers } from 'layers/network';
import { RootStore } from './store';

export const NetworkContext = React.createContext<Layers>({} as Layers);
export const RootContext = React.createContext<typeof RootStore>(RootStore);
