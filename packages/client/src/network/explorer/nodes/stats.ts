import { World } from 'engine/recs';

import { Components } from 'network/';
import { queryAllAccounts } from 'network/shapes/Account';
import { getScavengeFromHash, NullScavenge, queryScavInstance } from 'network/shapes/Scavenge';
import { getAccountIndex, getName, getValue } from 'network/shapes/utils/component';

export const getScavenges = (
  world: World,
  comps: Components,
  index: number, // node index
  limit = 200,
  flatten = false
) => {
  const entities = queryAllAccounts(comps);
  const scavenge = getScavengeFromHash(world, comps, 'NODE', index) ?? NullScavenge;

  const raw = entities.map((entity, i) => {
    const id = world.entities[entity];
    const scavInstanceEntity = queryScavInstance(world, 'NODE', index, id);

    let rolls = 0;
    if (scavInstanceEntity) {
      const points = getValue(comps, scavInstanceEntity);
      rolls = Math.floor(points / scavenge.cost);
    }

    return {
      rank: 0,
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      rolls,
    };
  });
  const ranked = raw.sort((a, b) => b.rolls - a.rolls);
  const filtered = ranked.filter((result) => result.rolls > 0);
  const truncated = filtered.slice(0, limit);
  truncated.forEach((_, i) => (truncated[i].rank = i + 1));

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, i) => `${i + 1}. ${result.name}: ${result.rolls}`);
  }
  return truncated;
};
