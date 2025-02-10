import { TransactionReceipt, TransactionRequest } from '@ethersproject/providers';
import { Cached } from '@mud-classic/utils';
import { CallOverrides } from 'ethers';

import { Contracts } from 'engine/types';

export type TxQueue = { call: TxCall; systems: SystemQueue<any extends Contracts ? any : never> };
export type SystemQueue<C extends Contracts> = Cached<C>;
export type TxCall = (
  txRequest: TransactionRequest,
  callOverrides?: CallOverrides
) => Promise<{
  hash: string;
  wait: () => Promise<TransactionReceipt>;
  response: Promise<any>;
}>;
