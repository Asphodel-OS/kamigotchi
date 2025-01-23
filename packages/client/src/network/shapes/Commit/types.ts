import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';

export interface Commit {
  id: EntityID;
  entity: EntityIndex;
  revealBlock: number;
  holder: EntityID;
  type: string;
}

export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  holderID?: EntityID
): Commit => {
  const { HolderID, RevealBlock, Type } = components;

  return {
    id: world.entities[entity],
    entity,
    revealBlock: (getComponentValue(RevealBlock, entity)?.value as number) * 1,
    holder: holderID ?? formatEntityID(getComponentValue(HolderID, entity)?.value ?? ''),
    type: getComponentValue(Type, entity)?.value as string,
  };
};
