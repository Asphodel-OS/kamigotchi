import { unpackTuple } from '@mud-classic/utils';
import { formatComponentID, formatEntityID } from 'engine/utils';
import { id, solidityPackedKeccak256 } from 'ethers';

import { StateCache } from '../state/cache';
import { resolveKey, toUpdate } from './emit';

// Walk rule: kw/.omc/plans/tiered-boot-poc.md §2. Ids are the contracts' `uint256 constant ID`
// strings, formatted the way both the kamigaze load and the live stream key StateCache
// components (formatComponentID, leading zero bytes stripped).
const componentId = (contractId: string) => formatComponentID(id(contractId));

export const WALK_IDS = {
  IsRegistry: componentId('component.is.registry'),
  EntityType: componentId('component.type.entity'),
  IDAnchor: componentId('component.id.anchor'),
  LogicType: componentId('component.logictype'),
  Keys: componentId('component.keys'),
  Values: componentId('component.values'),
  IDOwnsKami: componentId('component.id.kami.owns'),
  IDOwnsQuest: componentId('component.id.quest.owns'),
  links: [
    'component.id.equipment.owns',
    'component.id.flag.owns',
    'component.id.inventory.owns',
    'component.id.kami.owns',
    'component.id.kamiorder.owns',
    'component.id.quest.owns',
    'component.id.relationship.owns',
    'component.id.skill.owns',
    'component.id.tax.owns',
    'component.id.trade.owns',
    'component.id.token.withdraw.owns',
    'component.id.holder',
    'component.cache.operator',
  ].map(componentId),
};
export type WalkIds = typeof WALK_IDS;

// RELATIONSHIP is left out on purpose: player relationship instances share that type.
export const REGISTRY_TYPES = new Set([
  'ROOM',
  'NODE',
  'NPC',
  'FACTION',
  'GOAL',
  'AUCTION',
  'LISTING',
  'POOL',
  'ALLOCATION',
  'REFERENCE',
]);

export const snapshotAnchor = (questId: string) =>
  formatEntityID(solidityPackedKeccak256(['string', 'uint256'], ['snapshot.anchor', questId]));

export const goalContribution = (goalId: string, accountId: string) =>
  formatEntityID(
    solidityPackedKeccak256(
      ['string', 'uint256', 'uint256'],
      ['goal.contribution', goalId, accountId]
    )
  );

// One pass over every row, so the census can walk thousands of accounts off a single scan.
// Link and anchor values are compared as decoded strings: uint256 values decode to the same
// unpadded '0x' form formatEntityID gives entity ids.
export type Scan = {
  cache: StateCache;
  isRegistry: Set<number>;
  entityType: Map<number, string>;
  logicType: Set<number>;
  linked: Set<number>;
  ownsKami: Set<number>;
  ownsQuest: Set<number>;
  keysValuesOnly: Set<number>;
  linksTo: Map<string, number[]>;
  anchoredTo: Map<string, number[]>;
};

const push = (map: Map<string, number[]>, key: string, entity: number) => {
  const list = map.get(key);
  if (list) list.push(entity);
  else map.set(key, [entity]);
};

export const scanCache = (cache: StateCache, ids: WalkIds): Scan => {
  const idx = (componentId: string) => cache.componentToIndex.get(componentId) ?? -1;
  const isRegistry = idx(ids.IsRegistry);
  const entityType = idx(ids.EntityType);
  const anchor = idx(ids.IDAnchor);
  const logicType = idx(ids.LogicType);
  const keys = idx(ids.Keys);
  const values = idx(ids.Values);
  const ownsKami = idx(ids.IDOwnsKami);
  const ownsQuest = idx(ids.IDOwnsQuest);
  const links = new Set(ids.links.map(idx));

  const scan: Scan = {
    cache,
    isRegistry: new Set(),
    entityType: new Map(),
    logicType: new Set(),
    linked: new Set(),
    ownsKami: new Set(),
    ownsQuest: new Set(),
    keysValuesOnly: new Set(),
    linksTo: new Map(),
    anchoredTo: new Map(),
  };
  const notKeysValues = new Set<number>();

  for (const [key, row] of cache.state) {
    const [component, entity] = unpackTuple(key);
    const value = String((row as { value?: unknown }).value);

    if (component === keys || component === values) scan.keysValuesOnly.add(entity);
    else notKeysValues.add(entity);

    if (component === isRegistry) scan.isRegistry.add(entity);
    else if (component === entityType) scan.entityType.set(entity, value);
    else if (component === anchor) push(scan.anchoredTo, value, entity);
    else if (component === logicType) scan.logicType.add(entity);

    if (links.has(component)) {
      scan.linked.add(entity);
      push(scan.linksTo, value, entity);
      if (component === ownsKami) scan.ownsKami.add(entity);
      if (component === ownsQuest) scan.ownsQuest.add(entity);
    }
  }
  for (const entity of notKeysValues) scan.keysValuesOnly.delete(entity);
  return scan;
};

const indexOf = (cache: StateCache, entityId: string) =>
  cache.entityToIndex.get(formatEntityID(entityId));

export const registryBuckets = (scan: Scan, configIds: string[]) => {
  const { entities } = scan.cache;

  const R0 = new Set(scan.isRegistry);
  for (const [entity, type] of scan.entityType) if (REGISTRY_TYPES.has(type)) R0.add(entity);

  const R1 = new Set<number>();
  for (const parent of R0) {
    for (const child of scan.anchoredTo.get(entities[parent]!) ?? []) R1.add(child);
  }
  for (const entity of scan.logicType) if (!scan.linked.has(entity)) R1.add(entity);

  const R3 = new Set<number>();
  for (const configId of configIds) {
    const entity = indexOf(scan.cache, configId);
    if (entity != null) R3.add(entity);
  }

  return { R0, R1, R2: scan.keysValuesOnly, R3 };
};

export const accountBuckets = (scan: Scan, accountId: string) => {
  const { cache } = scan;
  const { entities } = cache;
  const account = formatEntityID(accountId);

  const A = new Set<number>();
  const self = indexOf(cache, account);
  if (self != null) A.add(self);

  const H1 = new Set(scan.linksTo.get(account) ?? []);

  const H2 = new Set<number>();
  for (const kami of H1) {
    if (!scan.ownsKami.has(kami)) continue;
    for (const entity of scan.linksTo.get(entities[kami]!) ?? []) H2.add(entity);
  }

  const D = new Set<number>();
  for (const quest of H1) {
    if (!scan.ownsQuest.has(quest)) continue;
    for (const entity of scan.anchoredTo.get(snapshotAnchor(entities[quest]!)) ?? []) D.add(entity);
  }
  for (const [goal, type] of scan.entityType) {
    if (type !== 'GOAL') continue;
    const contribution = indexOf(cache, goalContribution(entities[goal]!, account));
    if (contribution != null) D.add(contribution);
  }

  return { A, H1, H2, D };
};

export const union = (...sets: Set<number>[]) => {
  const all = new Set<number>();
  for (const set of sets) for (const entity of set) all.add(entity);
  return all;
};

export const walkRegistry = (cache: StateCache, ids: WalkIds, configIds: string[]) =>
  union(...Object.values(registryBuckets(scanCache(cache, ids), configIds)));

export const walkAccount = (cache: StateCache, ids: WalkIds, accountId: string) =>
  union(...Object.values(accountBuckets(scanCache(cache, ids), accountId)));

export function* entriesFor(cache: StateCache, entities: Set<number> | 'all') {
  for (const [key, value] of cache.state) {
    if (entities !== 'all' && !entities.has(unpackTuple(key)[1])) continue;
    const resolved = resolveKey(cache, key);
    if (resolved) yield toUpdate(resolved, value, cache.blockNumber);
  }
}
