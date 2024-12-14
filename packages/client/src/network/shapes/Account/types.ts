import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getReputation } from '../Faction';
import { Inventory } from '../Inventory';
import { getMusuBalance } from '../Item';
import { Kami, KamiOptions } from '../Kami';
import { getStamina, Stat } from '../Stats';
import {
  getAccountIndex,
  getLastActionTime,
  getLastTime,
  getOperatorAddress,
  getOwnerAddress,
  getRoomIndex,
  getStartTime,
} from '../utils/component';
import { Configs, getConfigs } from './configs';
import { Friends, getFriends } from './friends';
import { getInventories } from './inventories';
import { getKamis } from './kamis';
import { getStats, Stats } from './stats';

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
  stamina: Stat;
  roomIndex: number;
  reputation: {
    agency: number;
  };
  time: {
    last: number;
    action: number;
    creation: number;
  };

  config?: Configs;
  kamis?: Kami[];
  friends?: Friends;
  inventories?: Inventory[];
  stats?: Stats;
}

export interface Options {
  config?: boolean;
  friends?: boolean;
  inventory?: boolean;
  kamis?: boolean | KamiOptions;
  stats?: boolean;
}

// get a BaseAccount from its EntityIndex
export const getBaseAccount = (
  world: World,
  components: Components,
  entity: EntityIndex
): BaseAccount => {
  const { MediaURI, Name } = components;

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
  const { FarcasterIndex } = components;

  const bareAcc = getBaseAccount(world, components, entity);
  const id = bareAcc.id;

  let account: Account = {
    ...bareAcc,
    fid: getComponentValue(FarcasterIndex, entity)?.value as number,
    coin: getMusuBalance(world, components, entity),
    stamina: getStamina(components, entity),
    roomIndex: getRoomIndex(components, entity),
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

  if (options?.config) account.config = getConfigs(world, components);
  if (options?.friends) account.friends = getFriends(world, components, entity);
  if (options?.inventory) account.inventories = getInventories(world, components, entity);
  if (options?.kamis) {
    const kamiOptions = typeof options.kamis === 'boolean' ? {} : options.kamis;
    account.kamis = getKamis(world, components, entity, kamiOptions);
  }
  if (options?.stats) account.stats = getStats(world, components, entity);
  return account;
};
