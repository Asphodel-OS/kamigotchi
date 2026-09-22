import { describe, expect, it } from 'vitest';

import { createStateCache } from 'workers/sync/state';

describe('state barrel', () => {
  it('loads the sync state module chain under node', () => {
    expect(typeof createStateCache).toBe('function');
  });
});
