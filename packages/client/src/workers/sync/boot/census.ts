import { unpackTuple } from '@mud-classic/utils';
import { formatComponentID } from 'engine/utils';

import { StateCache } from '../state/cache';
import {
  accountBuckets,
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
  for (const [entity, stats] of perEntity) {
    if (walked.has(entity)) continue;
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

  console.log(
    `[census] snapshot as of LIVE (not updated after) account=${input.accountId ?? 'none'} ` +
      `accounts=${accounts} ` +
      `configIds=${input.configIds?.length ?? 0} configFound=${registry.R3.size} ms=${Math.round(performance.now() - started)}`
  );
  console.table(bucketTable);
  console.log(
    `[census] registry-typed entities carrying a link: ${linkedRegistryTypes.length} (gate: 0)`,
    linkedRegistryTypes.slice(0, SAMPLE_LIMIT)
  );
  console.table(residualTable);

  return { buckets: bucketTable, linkedRegistryTypes, residual: residualTable };
};
