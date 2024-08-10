import { Components, EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { Account } from '../Account';
import { Kami } from '../Kami';

export type ForType = '' | 'ACCOUNT' | 'KAMI';

// to be used for other functions that use For
export interface ForShapeOptions {
  account?: Account;
  kami?: Kami;
}

export const getFor = (world: World, components: Components, entityIndex: EntityIndex): ForType => {
  const { ForID, For } = components;

  const rawValue = getComponentValue(ForID, entityIndex)?.value;
  if (!rawValue) return '';

  const regIndex = world.entityToIndex.get(rawValue as EntityID);
  if (!regIndex) return '';

  return getComponentValue(For, regIndex)?.type as ForType;
};
