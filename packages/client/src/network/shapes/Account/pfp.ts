import { EntityIndex, World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getMediaURI } from '../utils/component';

export const getPfpURI = (world: World, components: Components, entity: EntityIndex): string => {
  const id = world.entities[entity];
  return getMediaURI(components, entity);
};
