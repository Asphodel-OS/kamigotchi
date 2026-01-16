import { Cached } from '@mud-classic/utils';
import { Overrides, TransactionReceipt, TransactionRequest } from 'ethers';

import { Contracts } from 'engine/types';
import { GasEstimationCache } from './gasCache';

export type TxQueue = {
  call: TxCall;
  systems: SystemQueue<any extends Contracts ? any : never>;
  gasCache: GasEstimationCache;
};
export type SystemQueue<C extends Contracts> = Cached<C>;
export type TxCall = (
  txRequest: TransactionRequest,
  callOverrides?: Overrides
) => Promise<{
  hash: string;
  wait: () => Promise<TransactionReceipt>;
  response: Promise<any>;
}>;
