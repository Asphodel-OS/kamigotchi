import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { getReputation } from '../Faction';
import { Inventory } from '../Inventory';
import { getMusuBalance } from '../Item';
import { Kami, KamiOptions } from '../Kami';
import {
  getAccountIndex,
  getLastActionTime,
  getLastTime,
  getOperatorAddress,
  getOwnerAddress,
  getStartTime,
} from '../utils/component';
import { Friends, getFriends } from './friends';
import { getInventories } from './inventories';
import { getKamis } from './kamis';
import { getStats } from './stats';

// account shape with minimal fields
export interface BaseAccount {
  ObjectType: string;
  id: EntityID;
  index: number;
  entity: EntityIndex;
  ownerAddress: string;
  operatorAddress: string;
  name: string;
  pfpURI: string;
}

// standardized shape of an Account Entity
export interface Account extends BaseAccount {
  fid: number;
  coin: number;
  roomIndex: number;
  reputation: {
    agency: number;
  };
  time: {
    last: number;
    action: number;
    creation: number;
  };
  kamis?: Kami[];
  friends?: Friends;
  inventories?: Inventory[];
  stats?: {
    kills: number;
    coin: number;
  };
}

export interface Options {
  friends?: boolean;
  inventory?: boolean;
  kamis?: boolean | KamiOptions;
  stats?: boolean;
}

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
  time: {
    last: 0,
    action: 0,
    creation: 0,
  },
  kamis: [],
};

// get a BaseAccount from its EntityIndex
export const getBaseAccount = (
  world: World,
  components: Components,
  entity: EntityIndex
): BaseAccount => {
  const { AccountIndex, MediaURI, Name, OperatorAddress, OwnerAddress } = components;

  return {
    ObjectType: 'ACCOUNT',
    id: world.entities[entity],
    entity,
    index: getAccountIndex(components, entity),
    operatorAddress: getOperatorAddress(components, entity),
    ownerAddress: getOwnerAddress(components, entity),
    pfpURI: getComponentValue(MediaURI, entity)?.value as string,
    name: getComponentValue(Name, entity)?.value as string,
  };
};

// get an Account from its EnityIndex
export const getAccount = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Account => {
  const { FarcasterIndex, LastTime, RoomIndex, StartTime } = components;

  const bareAcc = getBaseAccount(world, components, entity);
  const id = bareAcc.id;

  let account: Account = {
    ...bareAcc,
    fid: getComponentValue(FarcasterIndex, entity)?.value as number,
    coin: getMusuBalance(world, components, entity),
    roomIndex: getComponentValue(RoomIndex, entity)?.value as number,
    reputation: {
      agency: getReputation(world, components, id, 1), // get agency rep
    },
    time: {
      last: getLastTime(components, entity),
      action: getLastActionTime(components, entity),
      creation: getStartTime(components, entity),
    },
  };

  // prevent further queries if account hasnt loaded yet
  if (!account.ownerAddress) return account;

  /////////////////
  // OPTIONAL DATA

  if (options?.friends) account.friends = getFriends(world, components, entity);
  if (options?.inventory) account.inventories = getInventories(world, components, entity);
  if (options?.kamis) {
    const kamiOptions = typeof options.kamis === 'boolean' ? {} : options.kamis;
    account.kamis = getKamis(world, components, entity, kamiOptions);
  }
  if (options?.stats) account.stats = getStats(world, components, entity);
  return account;
};
