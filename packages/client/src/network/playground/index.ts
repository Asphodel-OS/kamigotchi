import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { AdminAPI, PlayerAPI } from 'network/api';
import { Inventory, queryInventoryX } from 'network/shapes/Item/Inventory';

// explorer for our 'shapes', exposed on the window object @ network.explorer
export const initPlayground = (
  world: World,
  components: Components,
  api: { admin: AdminAPI; player: PlayerAPI }
) => {
  const getTargetInvs = (index: number): Inventory[] => {
    return queryInventoryX(world, components, { itemIndex: index });
  };

  const splitAndID = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result.map((arr) => arr.map((item) => item.id));
  };

  const run = async () => {
    const invs = getTargetInvs(1001);
    const processed = splitAndID(invs, 30);
    console.log(invs);
    console.log(splitAndID(invs, 30));
    for (let i = 0; i < processed.length; i++) {
      await api.admin.deleteInv(processed[i]);
    }
  };

  return {
    all: () => getTargetInvs(1001),
    run: run,
  };
};
