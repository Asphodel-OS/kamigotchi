import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { BaseNode, getBaseNodeByIndex } from '../Node';
import { getDataArray } from '../utils';
import { BaseKami, getBaseKami } from './types';

// standardized Object shape of a KillLog Entity
export interface KillLog {
  id: EntityID;
  entityIndex: EntityIndex;
  source: BaseKami;
  target: BaseKami;
  node: BaseNode;
  balance: number;
  bounty: number;
  time: number;
}

// get a KillLog object from its EnityIndex
export const getKill = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): KillLog => {
  const { NodeIndex, SourceID, TargetID, Time } = components;

  const id = world.entities[entityIndex];
  const bounties = getDataArray(world, components, id, 'KILL_BOUNTIES');

  // identify the Node
  const nodeIndex = (getComponentValue(NodeIndex, entityIndex)?.value ?? 0) * 1;
  const node = getBaseNodeByIndex(world, components, nodeIndex); // update to bare

  // identify the Source and Target Kamis
  const sourceID = formatEntityID(getComponentValue(SourceID, entityIndex)?.value ?? '');
  const targetID = formatEntityID(getComponentValue(TargetID, entityIndex)?.value ?? '');
  const sourceEntity = world.entityToIndex.get(sourceID) as EntityIndex;
  const targetEntity = world.entityToIndex.get(targetID) as EntityIndex;

  const killLog: KillLog = {
    id,
    entityIndex,
    node: node,
    balance: bounties[0],
    bounty: bounties[1],
    time: (getComponentValue(Time, entityIndex)?.value as number) * 1,
    source: getBaseKami(world, components, sourceEntity),
    target: getBaseKami(world, components, targetEntity),
  };

  return killLog;
};

/////////////////
// GETTERS

// get all kill logs featuring a Kami (by its entityIndex)
export const getKamiBattles = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): KillLog[] => {
  const kills = getKamiKills(world, components, entityIndex);
  const deaths = getKamiDeaths(world, components, entityIndex);
  return [...kills, ...deaths].sort((a, b) => b.time - a.time);
};

export const getKamiKills = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): KillLog[] => {
  const kami = getBaseKami(world, components, entityIndex);
  const results = queryKamiKills(components, kami);
  return results.map((index) => getKill(world, components, index));
};

export const getKamiDeaths = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): KillLog[] => {
  const kami = getBaseKami(world, components, entityIndex);
  const results = queryKamiDeaths(components, kami);
  return results.map((index) => getKill(world, components, index));
};

/////////////////
// QUERIES

// query kill logs where a input Kamiis the victim
export const queryKamiDeaths = (components: Components, kami: BaseKami): EntityIndex[] => {
  const { IsKill, TargetID } = components;
  return Array.from(runQuery([HasValue(TargetID, { value: kami.id }), Has(IsKill)]));
};

// query kill logs where the input Kami is the aggressor
export const queryKamiKills = (components: Components, kami: BaseKami): EntityIndex[] => {
  const { IsKill, SourceID } = components;
  return Array.from(runQuery([HasValue(SourceID, { value: kami.id }), Has(IsKill)]));
};
