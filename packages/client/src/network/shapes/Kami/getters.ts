import { EntityID, getComponentValue, HasValue, runQuery, World } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/components';
import { BaseAccount, getBaseAccount, NullAccount } from '../Account';
import { query } from './queries';
import { getKami, Options } from './types';

// get all Kamis
export const getAll = (world: World, components: Components, options?: Options) => {
  return query(components, {}).map((index) => getKami(world, components, index, options));
};

// get a Kami by its index (token ID)
// TODO: handle failed queries with a default NullKami
export const getByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
) => {
  const results = query(components, { index: index });
  if (results.length == 0) return;

  const entity = results[0];
  return getKami(world, components, entity, options);
};

// gat all Kamis owned by an Account based on its ID
export const getByAccount = (
  world: World,
  components: Components,
  accountID: string,
  options?: Options
) => {
  const results = query(components, { account: accountID as EntityID });
  return results.map((index) => getKami(world, components, index, options));
};

// get all Kamis based on their state
export const getByState = (
  world: World,
  components: Components,
  state: string,
  options?: Options
) => {
  const results = query(components, { state });
  return results.map((index) => getKami(world, components, index, options));
};

////////////////
// OTHER GETTERS

// get the BaseAccount entity that owns a Kami, queried by kami index
export const getAccount = (world: World, components: Components, index: number): BaseAccount => {
  const { EntityType, KamiIndex, OwnsKamiID } = components;
  const kamiEntity = Array.from(
    runQuery([HasValue(KamiIndex, { value: index }), HasValue(EntityType, { value: 'KAMI' })])
  )[0];

  const rawAccID = getComponentValue(OwnsKamiID, kamiEntity)?.value ?? '';
  if (!rawAccID) return NullAccount;

  const accID = formatEntityID(rawAccID);
  const accEntity = world.entityToIndex.get(accID);
  if (!accEntity) return NullAccount;

  return getBaseAccount(world, components, accEntity);
};
