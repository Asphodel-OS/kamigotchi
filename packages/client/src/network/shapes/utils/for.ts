import { Components, EntityIndex, getComponentValue } from '@mud-classic/recs';
import { utils } from 'ethers';
import { Account } from '../Account';
import { Kami } from '../Kami';

const forAccount = utils.solidityKeccak256(['string'], ['for.account']);
const forKami = utils.solidityKeccak256(['string'], ['for.kami']);

export type ForType = '' | 'ACCOUNT' | 'KAMI';

// to be used for other functions that use For
export interface ForShapeOptions {
  account?: Account;
  kami?: Kami;
}

export const getFor = (components: Components, entity: EntityIndex): ForType => {
  const { For } = components;

  const rawValue = getComponentValue(For, entity)?.value;
  if (!rawValue) return '';

  const value = rawValue.toString();
  if (value === forAccount) return 'ACCOUNT';
  else if (value === forKami) return 'KAMI';
  else return '';
};
