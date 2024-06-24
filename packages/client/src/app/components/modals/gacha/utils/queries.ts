import { World } from '@mud-classic/recs';
import { Components } from 'network/';
import { Kami, KamiOptions, QueryOptions, getKami, queryKamiEntitiesX } from 'network/shapes/Kami';

export const getLazyKamis = (
  world: World,
  components: Components
): ((queryOpts: QueryOptions, options?: KamiOptions) => Array<() => Kami>) => {
  return (queryOpts: QueryOptions, options?: KamiOptions) =>
    _getLazyKamis(world, components, queryOpts, options);
};

const _getLazyKamis = (
  world: World,
  components: Components,
  queryOpts: QueryOptions,
  options?: KamiOptions
): Array<() => Kami> => {
  const kamiIDs = queryKamiEntitiesX(components, queryOpts);

  return kamiIDs.map(
    (index): (() => Kami) =>
      () =>
        getKami(world, components, index, options)
  );
};
