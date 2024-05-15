import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { BigNumber, utils } from 'ethers';
import { Components } from 'layers/network';

export const getBonusValue = (
  world: World,
  components: Components,
  holderID: EntityID,
  type: string,
  precision: number = 0
): number => {
  const { BalanceSigned } = components;
  const entityIndex = getEntityIndex(world, holderID, type);
  if (!entityIndex) return 0;

  const raw = BigNumber.from(getComponentValue(BalanceSigned, entityIndex)?.value ?? 0);
  return raw.fromTwos(256).toNumber() / 10 ** precision;
};

////////////////////
// UTILS

const getEntityIndex = (
  world: World,
  holderID: EntityID,
  field: string
): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(
    ['string', 'uint256', 'string'],
    ['bonus', holderID ?? 0, field]
  );
  return world.entityToIndex.get(id as EntityID);
};
