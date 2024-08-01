import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';
import { DTResult, getDTResults, getDroptable } from './Droptable';
import { getItemDetails, getItemRegEntity } from './Item';
import { Commit, queryHolderCommits } from './utils/commits';

const IDStore = new Map<string, string>();

export interface LootboxLog {
  id: EntityID;
  results: DTResult[];
}

export const NullLootboxLog: LootboxLog = {
  id: '0' as EntityID,
  results: [],
};

export const queryLootboxCommits = (
  world: World,
  components: Components,
  accountID: EntityID
): Commit[] => {
  return queryHolderCommits(world, components, 'LOOTBOX_COMMIT', accountID);
};

// gets the latest lootbox result
export const getLootboxLogByHash = (
  world: World,
  components: Components,
  holderID: EntityID,
  boxIndex: number
): LootboxLog => {
  const entityIndex = getLogEntityIndex(world, holderID, boxIndex);
  if (!entityIndex) return NullLootboxLog;

  const { Values } = components;
  const amounts = getComponentValue(Values, entityIndex)?.value as number[] | [];
  return {
    id: world.entities[entityIndex],
    results: getItemDetailsFromDT(world, components, boxIndex, amounts),
  };
};

const getLogEntityIndex = (
  world: any,
  holderID: EntityID | undefined,
  itemIndex: number
): EntityIndex | undefined => {
  if (!holderID) return;
  let id = '';
  const key = 'lootbox.log' + holderID + itemIndex.toString();

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(['string', 'uint256', 'uint32'], ['lootbox.log', holderID, itemIndex])
    );
  }
  return world.entityToIndex.get(id);
};

// gets items from lootbox log, filtering out empty
const getItemDetailsFromDT = (
  world: World,
  components: Components,
  boxIndex: number,
  amounts: number[]
): DTResult[] => {
  const dt = getDroptable(components, getItemRegEntity(world, boxIndex)!);
  const getObject = (index: number) =>
    getItemDetails(components, getItemRegEntity(world, index) || (0 as EntityIndex));

  return getDTResults(components, dt, amounts, getObject);
};
