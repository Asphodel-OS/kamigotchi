import { World } from '@mud-classic/recs';
import { Components } from 'layers/network';
import {
  Kami,
  Options,
  QueryOptions,
  getKami,
  queryKamiEntitiesX,
} from 'layers/network/shapes/Kami';

export const getLazyKamis = (
  world: World,
  components: Components
): ((queryOpts: QueryOptions, options?: Options) => Array<() => Kami>) => {
  return (queryOpts: QueryOptions, options?: Options) =>
    _getLazyKamis(world, components, queryOpts, options);
};

const _getLazyKamis = (
  world: World,
  components: Components,
  queryOpts: QueryOptions,
  options?: Options
): Array<() => Kami> => {
  const kamiIDs = queryKamiEntitiesX(components, queryOpts);

  return kamiIDs.map(
    (index): (() => Kami) =>
      () =>
        getKami(world, components, index, options)
  );
};
