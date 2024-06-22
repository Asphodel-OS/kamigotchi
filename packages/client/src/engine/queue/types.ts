import { Cached } from '@mud-classic/utils';

import { Contracts } from 'engine/types';

export type TxQueue<C extends Contracts> = Cached<C>;
