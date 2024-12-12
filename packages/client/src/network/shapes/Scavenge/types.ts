import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { Components } from 'network/';
import { Allo, getAllo } from '../Allo';
import { queryChildrenOf } from '../utils';
import { getIndex, getType, getValue } from '../utils/component';
import { queryRewardAnchor } from './queries';

export interface ScavBar {
  id: EntityID;
  entity: EntityIndex;
  type: string;
  index: number;
  cost: number;
  rewards: Allo[];
}

export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  type?: string,
  index?: number
): ScavBar => {
  const id = world.entities[entity];
  const rewardAnchor = queryRewardAnchor(id);
  const rewardEntities = queryChildrenOf(components, rewardAnchor);

  return {
    id,
    entity,
    type: type ?? getType(components, entity),
    index: index ?? getIndex(components, entity),
    cost: getValue(components, entity),
    rewards: rewardEntities.map((entiti: EntityIndex) => getAllo(world, components, entiti)),
  };
};

export const NullScavenge: ScavBar = {
  id: '0' as EntityID,
  entity: 0 as EntityIndex,
  index: 0,
  type: '',
  cost: 100,
  rewards: [],
};
