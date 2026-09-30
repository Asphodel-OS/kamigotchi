import { MergeStats } from './merge';

export type Trace = MergeStats & { unresolved: number; ms: number };

export const formatTrace = (t: Trace) =>
  `[tier] load=${t.load} block=${t.block} gap=${t.gap} log=${t.log} deferred=${t.deferred} ` +
  `removed=${t.removed} unresolved=${t.unresolved} ms=${Math.round(t.ms)}`;
