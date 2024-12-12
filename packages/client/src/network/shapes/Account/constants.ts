import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Account } from './types';

export const NullAccount: Account = {
  ObjectType: 'ACCOUNT',
  id: '0' as EntityID,
  entity: 0 as EntityIndex,
  index: 0,
  operatorAddress: '',
  ownerAddress: '',
  fid: 0,
  name: '',
  pfpURI: '',

  coin: 0,
  roomIndex: 0,
  reputation: {
    agency: 0,
  },
  stamina: { base: 0, shift: 0, boost: 0, sync: 0, rate: 0, total: 20 },
  time: {
    last: 0,
    action: 0,
    creation: 0,
  },
  kamis: [],
};
