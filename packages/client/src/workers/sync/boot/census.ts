import { unpackTuple } from '@mud-classic/utils';
import { formatComponentID, formatEntityID } from 'engine/utils';
import { id } from 'ethers';

import { StateCache } from '../state/cache';
import {
  accountBuckets,
  bonusEndAnchor,
  ownershipClosure,
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
const INDEX_ACCOUNT = formatComponentID(id('component.index.account'));

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

  // LibAccount.create sets IndexAccount; an account-like entity without EntityType would
  // otherwise leave everything it owns in the residual
  const indexAccount = cache.componentToIndex.get(INDEX_ACCOUNT);
  const untypedAccounts = [...perEntity]
    .filter(([e, stats]) => !scan.entityType.has(e) && stats.components.includes(indexAccount!))
    .map(([e]) => e);
  const accountEntities = [
    ...[...scan.entityType].filter(([, type]) => type === 'ACCOUNT').map(([e]) => e),
    ...untypedAccounts,
  ];

  const walked = union(...Object.values(registry));
  for (const entity of accountEntities) {
    for (const set of Object.values(accountBuckets(scan, cache.entities[entity]!))) {
      for (const e of set) walked.add(e);
    }
  }

  const closureDepths: Record<number, number> = {};
  if (input.accountId) {
    for (const hop of ownershipClosure(scan, input.accountId).values()) {
      closureDepths[hop] = (closureDepths[hop] ?? 0) + 1;
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

  const signatureOf = (entity: number) =>
    [...new Set(perEntity.get(entity)?.components.map(componentName) ?? [])].sort().join('+');
  const { residualLinks, untypedTargets } = residualLinkTable(
    cache,
    scan,
    residualEntities,
    componentName,
    signatureOf
  );
  const configFound = (input.configIds ?? []).filter((id) =>
    cache.entityToIndex.has(formatEntityID(id))
  ).length;

  console.log(
    `[census] snapshot as of LIVE (not updated after) account=${input.accountId ?? 'none'} ` +
      `accounts=${accountEntities.length} untypedAccounts=${untypedAccounts.length} configIds=${input.configIds?.length ?? 0} ` +
      `configFound=${configFound} ms=${Math.round(performance.now() - started)}`
  );
  console.table(bucketTable);
  console.log('[census] ownership closure (H) of the account, entities per hop', closureDepths);
  console.log(
    `[census] registry-typed entities carrying a link: ${linkedRegistryTypes.length} (gate: 0)`,
    linkedRegistryTypes.slice(0, SAMPLE_LIMIT)
  );
  console.table(residualTable);
  console.log('[census] residual entities by link/anchor component -> target kind');
  console.table(residualLinks);
  console.log('[census] untyped link targets by their own component signature');
  console.table(untypedTargets);

  return {
    buckets: bucketTable,
    closureDepths,
    linkedRegistryTypes,
    residual: residualTable,
    residualLinks,
    untypedAccounts: untypedAccounts.length,
    untypedTargets,
  };
};

// Explains why linked residuals were not walked: what their link (or IDAnchor) points at.
// A target is 'zero', an EntityType, 'untyped-entity', a bonus end anchor of an ACCOUNT/KAMI
// holder, or 'unknown-entity' (a hash with no rows of its own).
const residualLinkTable = (
  cache: StateCache,
  scan: ReturnType<typeof scanCache>,
  residualEntities: Set<number>,
  componentName: (idx: number) => string,
  signatureOf: (entity: number) => string
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
    if (entity == null) return endAnchors.get(target) ?? 'unknown-entity';
    const type = scan.entityType.get(entity);
    if (type) return type;
    untyped.add(entity);
    return 'untyped-entity';
  };
  const untyped = new Set<number>();

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
  const residualLinks = [...groups]
    .map(([link, group]) => ({ link, ...group }))
    .sort((a, b) => b.count - a.count);

  const bySignature = new Map<string, { count: number; sample: string }>();
  for (const entity of untyped) {
    const signature = signatureOf(entity) || '(no rows)';
    const group = bySignature.get(signature);
    if (group) group.count++;
    else bySignature.set(signature, { count: 1, sample: cache.entities[entity]! });
  }
  const untypedTargets = [...bySignature]
    .map(([signature, group]) => ({ signature, ...group }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { residualLinks, untypedTargets };
};
