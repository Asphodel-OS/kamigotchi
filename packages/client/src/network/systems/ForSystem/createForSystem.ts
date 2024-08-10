import { EntityID, World, createEntity, setComponent } from '@mud-classic/recs';
import { Components } from 'network/';
import { forIDs } from './constants';

export type ForSystem = ReturnType<typeof createForSystem>;

// local system to fill/cache data for ForIDs
export function createForSystem(world: World, components: Components) {
  const { For } = components;

  init();

  function add(
    id: EntityID,
    type: string,
    name?: string,
    subtype?: string,
    index?: number,
    value?: string
  ) {
    const entityIndex = createEntity(world, undefined, { id });
    setComponent(For, entityIndex, {
      type: type,
      name: name,
      subtype: subtype,
      index: index,
      value: value,
    });
  }

  function init() {
    for (let i = 0; i < forIDs.length; i++) {
      add(forIDs[i].id as EntityID, forIDs[i].type);
    }
  }

  return {
    add,
  };
}
