import { packTuple } from '@mud-classic/utils';
import { describe, expect, it } from 'vitest';

import { createStateCache, trimToKamigazeIndices } from 'workers/sync/state';

const cacheWith = (components: string[], entities: string[], keys: [number, number][]) => ({
  ...createStateCache(),
  components,
  entities,
  lastKamigazeComponent: 1,
  lastKamigazeEntity: 1,
  state: new Map(keys.map(([c, e]) => [packTuple([c, e]), { value: `${c}:${e}` }])),
});

describe('trimToKamigazeIndices', () => {
  it('returns the cache untouched when nothing was appended past the Kamigaze watermark', () => {
    const cache = cacheWith(['0x0', 'c1'], ['0x0', 'e1'], [[1, 1]]);
    expect(trimToKamigazeIndices(cache)).toBe(cache);
  });

  it('drops locally appended ids and every value keyed by them', () => {
    const cache = cacheWith(
      ['0x0', 'c1', 'cLocal'],
      ['0x0', 'e1', 'eLocal'],
      [
        [1, 1],
        [2, 1],
        [1, 2],
      ]
    );
    const trimmed = trimToKamigazeIndices(cache);

    expect(trimmed.components).toEqual(['0x0', 'c1']);
    expect(trimmed.entities).toEqual(['0x0', 'e1']);
    expect([...trimmed.state.keys()]).toEqual([packTuple([1, 1])]);
    expect(cache.state.size).toBe(3);
  });
});
