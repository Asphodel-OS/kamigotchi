import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getMusuBalance } from '../Item';
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
  const { NodeID, PetID, State, LastTime, ResetTime, StartTime } = components;
  let production: Harvest = {
    id: world.entities[index],
    rate: 0,
    balance: getMusuBalance(world, components, world.entities[index]),
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
    const nodeID = formatEntityID(getComponentValue(NodeID, index)?.value ?? '');
    const nodeIndex = world.entityToIndex.get(nodeID);
    if (nodeIndex) production.node = getNode(world, components, nodeIndex);
  }

  /////////////////
  // ADJUSTMENTS

  // retrieve the kami if it's not passed in
  // NOTE: rate calcs only work if the node is set
  if (!kami) {
    const kamiID = formatEntityID(getComponentValue(PetID, index)?.value ?? '');
    const kamiEntityIndex = world.entityToIndex.get(kamiID) ?? (0 as EntityIndex);
    kami = getKami(world, components, kamiEntityIndex, { account: true, traits: true });
  }
  production.rate = calcRate(production, kami);
  return production;
};
