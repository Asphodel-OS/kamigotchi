import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { BigNumber, utils } from 'ethers';
import { Components } from 'network/';

const IDStore = new Map<string, string>();

export const getBonusValue = (
  world: World,
  components: Components,
  holderID: EntityID,
  type: string,
  precision: number = 0
): number => {
  const { ValueSigned } = components;
  const entityIndex = getEntityIndex(world, holderID, type);
  if (!entityIndex) return 0;

  const raw = BigNumber.from(getComponentValue(ValueSigned, entityIndex)?.value ?? 0);
  return raw.fromTwos(256).toNumber() / 10 ** precision;
};

////////////////////
// UTILS

const getEntityIndex = (
  world: World,
  holderID: EntityID,
  field: string
): EntityIndex | undefined => {
  const key = 'bonus' + holderID + field;

  let id = '';
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = utils.solidityKeccak256(['string', 'uint256', 'string'], ['bonus', holderID ?? 0, field]);
  }

  return world.entityToIndex.get(formatEntityID(id));
};
