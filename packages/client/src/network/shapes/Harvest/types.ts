import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';
import { Kami, getKami } from '../Kami';
import { Node, getNode } from '../Node';
import { calcRate } from './harvest';

// standardized shape of an Harvest Entity
export interface Harvest {
  id: EntityID;
  balance: number;
  rate: number;
  state: string;
  time: {
    last: number;
    reset: number;
    start: number;
  };
  node?: Node;
}

// optional data to populate for a Harvest Entity
export interface HarvestOptions {
  node?: boolean;
}

// get an Harvest from its EnityIndex
export const getHarvest = (
  world: World,
  components: Components,
  index: EntityIndex,
  options?: HarvestOptions,
  kami?: Kami
): Harvest => {
  const { HolderID, SourceID, State, LastTime, ResetTime, StartTime, Value } = components;
  let harvest: Harvest = {
    id: world.entities[index],
    rate: 0,
    balance: ((getComponentValue(Value, index)?.value as number) || 0) * 1,
    state: getComponentValue(State, index)?.value as string,
    time: {
      last: (getComponentValue(LastTime, index)?.value as number) * 1,
      reset: (getComponentValue(ResetTime, index)?.value as number) * 1,
      start: (getComponentValue(StartTime, index)?.value as number) * 1,
    },
  };

  /////////////////
  // OPTIONAL DATA

  // populate Node
  if (options?.node) {
    const nodeID = formatEntityID(getComponentValue(SourceID, index)?.value ?? '');
    const nodeIndex = world.entityToIndex.get(nodeID);
    if (nodeIndex) harvest.node = getNode(world, components, nodeIndex);
  }

  /////////////////
  // ADJUSTMENTS

  // retrieve the kami if it's not passed in
  // NOTE: rate calcs only work if the node is set
  if (!kami) {
    const kamiID = formatEntityID(getComponentValue(HolderID, index)?.value ?? '');
    const kamiEntityIndex = world.entityToIndex.get(kamiID) ?? (0 as EntityIndex);
    kami = getKami(world, components, kamiEntityIndex, { traits: true });
  }
  harvest.rate = calcRate(harvest, kami);
  return harvest;
};

/////////////////
// IDs

const IDStore = new Map<string, string>();

export const getHarvestEntity = (world: World, holderID: string): EntityIndex | undefined => {
  let id = '';
  const key = 'harvest' + holderID;

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(utils.solidityKeccak256(['string', 'uint256'], ['harvest', holderID]));
    IDStore.set(key, id);
  }

  return world.entityToIndex.get(id as EntityID);
};
