import { unpackTuple } from '@mud-classic/utils';
import { formatComponentID, formatEntityID } from 'engine/utils';

import { StateCache } from '../state/cache';
import {
  accountBuckets,
  bonusEndAnchor,
  REGISTRY_TYPES,
  registryBuckets,
  scanCache,
  union,
  WALK_IDS,
} from './walk';

export type CensusInput = {
  accountId?: string;
  configIds?: string[];
  // component id -> client component name, for readable residual signatures
  names?: Record<string, string>;
};

type EntityStats = { rows: number; bytes: number; components: number[] };

const SAMPLE_LIMIT = 5;

// Dev-only sizing of the plan §2 walk over a loaded cache; its residual table is the
// Phase 2 gate for rule gaps. Bytes are JSON-length approximations of decoded values.
export const runCensus = (cache: StateCache, input: CensusInput) => {
  const started = performance.now();
  const names = new Map(
    Object.entries(input.names ?? {}).map(([id, name]) => [formatComponentID(id), name])
  );
  const componentName = (idx: number) => {
    const componentId = cache.components[idx] ?? `#${idx}`;
    return names.get(componentId) ?? componentId.slice(0, 10);
  };

  const perEntity = new Map<number, EntityStats>();
  for (const [key, value] of cache.state) {
    const [component, entity] = unpackTuple(key);
    let stats = perEntity.get(entity);
    if (!stats) perEntity.set(entity, (stats = { rows: 0, bytes: 0, components: [] }));
    stats.rows++;
    stats.bytes += 4 + (JSON.stringify(value)?.length ?? 0);
    stats.components.push(component);
  }
  const size = (entities: Set<number>) => {
    let rows = 0;
    let bytes = 0;
    for (const entity of entities) {
      rows += perEntity.get(entity)?.rows ?? 0;
      bytes += perEntity.get(entity)?.bytes ?? 0;
    }
    return { entities: entities.size, rows, bytes };
  };

  const scan = scanCache(cache, WALK_IDS);
  const registry = registryBuckets(scan, input.configIds ?? []);
  const account = input.accountId ? accountBuckets(scan, input.accountId) : undefined;
  const buckets = { ...registry, ...account };
  const bucketTable = Object.fromEntries(
    Object.entries(buckets).map(([name, set]) => [name, size(set)])
  );
  bucketTable.registry = size(union(...Object.values(registry)));
  if (account) bucketTable.account = size(union(...Object.values(account)));
  bucketTable.all = size(new Set(perEntity.keys()));

  const linkedRegistryTypes = [...scan.entityType]
    .filter(([entity, type]) => REGISTRY_TYPES.has(type) && scan.linked.has(entity))
    .map(([entity, type]) => ({ entity: cache.entities[entity], type }));

  const walked = union(...Object.values(registry));
  let accounts = 0;
  for (const [entity, type] of scan.entityType) {
    if (type !== 'ACCOUNT') continue;
    accounts++;
    for (const set of Object.values(accountBuckets(scan, cache.entities[entity]!))) {
      for (const e of set) walked.add(e);
    }
  }

  const residual = new Map<string, { count: number; rows: number; sample: string }>();
  const residualEntities = new Set<number>();
  for (const [entity, stats] of perEntity) {
    if (walked.has(entity)) continue;
    residualEntities.add(entity);
    const signature = [...new Set(stats.components.map(componentName))].sort().join('+');
    const group = residual.get(signature);
    if (group) {
      group.count++;
      group.rows += stats.rows;
    } else {
      residual.set(signature, { count: 1, rows: stats.rows, sample: cache.entities[entity]! });
    }
  }
  const residualTable = [...residual]
    .map(([signature, group]) => ({ signature, ...group }))
    .sort((a, b) => b.count - a.count);

  const residualLinks = residualLinkTable(cache, scan, residualEntities, componentName);
  const configFound = (input.configIds ?? []).filter((id) =>
    cache.entityToIndex.has(formatEntityID(id))
  ).length;

  console.log(
    `[census] snapshot as of LIVE (not updated after) account=${input.accountId ?? 'none'} ` +
      `accounts=${accounts} configIds=${input.configIds?.length ?? 0} ` +
      `configFound=${configFound} ms=${Math.round(performance.now() - started)}`
  );
  console.table(bucketTable);
  console.log(
    `[census] registry-typed entities carrying a link: ${linkedRegistryTypes.length} (gate: 0)`,
    linkedRegistryTypes.slice(0, SAMPLE_LIMIT)
  );
  console.table(residualTable);
  console.log('[census] residual entities by link/anchor component -> target kind');
  console.table(residualLinks);

  return { buckets: bucketTable, linkedRegistryTypes, residual: residualTable, residualLinks };
};

// Explains why linked residuals were not walked: what their link (or IDAnchor) points at.
// A target is 'zero', an EntityType, 'untyped-entity', a bonus end anchor of an ACCOUNT/KAMI
// holder, or 'unknown-entity' (a hash with no rows of its own).
const residualLinkTable = (
  cache: StateCache,
  scan: ReturnType<typeof scanCache>,
  residualEntities: Set<number>,
  componentName: (idx: number) => string
) => {
  const idx = (componentId: string) => cache.componentToIndex.get(componentId) ?? -1;
  const traced = new Set([...WALK_IDS.links, WALK_IDS.IDAnchor].map(idx));

  const endAnchors = new Map<string, string>();
  for (const [entity, type] of scan.entityType) {
    if (type !== 'ACCOUNT' && type !== 'KAMI') continue;
    for (const endType of scan.bonusEndTypes) {
      endAnchors.set(bonusEndAnchor(endType, cache.entities[entity]!), `bonus-end-anchor:${type}`);
    }
  }
  const targetKind = (target: string) => {
    if (/^0x0*$/.test(target)) return 'zero';
    const entity = cache.entityToIndex.get(target);
    if (entity != null) return scan.entityType.get(entity) ?? 'untyped-entity';
    return endAnchors.get(target) ?? 'unknown-entity';
  };

  const groups = new Map<string, { count: number; sampleEntity: string; sampleTarget: string }>();
  for (const [key, row] of cache.state) {
    const [component, entity] = unpackTuple(key);
    if (!traced.has(component) || !residualEntities.has(entity)) continue;
    const target = String((row as { value?: unknown }).value);
    const group = `${componentName(component)} -> ${targetKind(target)}`;
    const existing = groups.get(group);
    if (existing) existing.count++;
    else
      groups.set(group, { count: 1, sampleEntity: cache.entities[entity]!, sampleTarget: target });
  }
  return [...groups].map(([link, group]) => ({ link, ...group })).sort((a, b) => b.count - a.count);
};
