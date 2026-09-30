import { formatComponentID } from 'engine/utils';
import { id } from 'ethers';
import { describe, expect, it } from 'vitest';

import { NetworkComponentUpdate, NetworkEvents } from 'workers/types';
import { routeLive, RouteState } from './route';
import { WALK_IDS } from './walk';

const IdHolder = formatComponentID(id('component.id.holder'));
const IdSource = formatComponentID(id('component.id.source'));
const OTHER = '0xc1';

const ACCOUNT = '0xa11ce';
const KAMI = '0x1000';
const NEW_KAMI = '0x2000';
const HARVEST = '0x3000';
const EXISTING = '0x4000';

// every event is lastEventInTx on the kamigaze stream (one log per message)
const ev = (txHash: string, entity: string, component: string, value: unknown) =>
  ({
    type: NetworkEvents.NetworkComponentUpdate,
    component,
    entity,
    value: { value },
    blockNumber: 1,
    txHash,
    lastEventInTx: true,
  }) as unknown as NetworkComponentUpdate;

const routeState = (): RouteState => {
  const known = new Set([ACCOUNT, KAMI, EXISTING]);
  return {
    accountId: ACCOUNT,
    playerIds: new Set([ACCOUNT, KAMI]),
    emittedEntities: new Set([ACCOUNT, KAMI]),
    held: new Map(),
    ready: new Set(),
    isKnown: (id) => known.has(id),
    merged: false,
  };
};

describe('routeLive', () => {
  it('(a) a kami minted during boot, then harvested, is emitted before LIVE', () => {
    const s = routeState();
    const kamiType = ev('0xt1', NEW_KAMI, WALK_IDS.EntityType, 'KAMI');
    const kamiOwner = ev('0xt1', NEW_KAMI, WALK_IDS.IDOwnsKami, ACCOUNT);
    expect(routeLive(kamiType, s)).toEqual([]);
    expect(routeLive(kamiOwner, s)).toEqual([]);
    expect(s.playerIds.has(NEW_KAMI)).toBe(true);

    const harvestType = ev('0xt2', HARVEST, WALK_IDS.EntityType, 'HARVEST');
    const harvestHolder = ev('0xt2', HARVEST, IdHolder, NEW_KAMI);
    expect(routeLive(harvestType, s)).toEqual([kamiType, kamiOwner]);
    expect(routeLive(harvestHolder, s)).toEqual([]);

    const harvestRate = ev('0xt3', HARVEST, '0xc2', 5);
    expect(routeLive(harvestRate, s)).toEqual([harvestType, harvestHolder, harvestRate]);
    expect(s.held.size).toBe(0);
  });

  it('a new entity is flushed with all its rows only once its creating tx has closed', () => {
    const s = routeState();
    const type = ev('0xt1', HARVEST, WALK_IDS.EntityType, 'HARVEST');
    const holder = ev('0xt1', HARVEST, IdHolder, KAMI);
    const source = ev('0xt1', HARVEST, IdSource, '0xn0de');
    expect(routeLive(type, s)).toEqual([]);
    expect(routeLive(holder, s)).toEqual([]);
    expect(routeLive(source, s)).toEqual([]);

    const next = ev('0xt2', KAMI, OTHER, 1);
    expect(routeLive(next, s)).toEqual([type, holder, source, next]);
  });

  it('(b) an existing entity transferred to the player is held until the final merge', () => {
    const s = routeState();
    expect(routeLive(ev('0xt1', EXISTING, WALK_IDS.IDOwnsKami, ACCOUNT), s)).toEqual([]);
    expect(routeLive(ev('0xt2', EXISTING, OTHER, 'x'), s)).toEqual([]);
    expect(s.emittedEntities.has(EXISTING)).toBe(false);
    expect(s.playerIds.has(EXISTING)).toBe(false);
  });

  it('an unknown entity whose creation is not in the log is held on a link to the player', () => {
    const s = routeState();
    expect(routeLive(ev('0xt1', '0x8000', IdHolder, ACCOUNT), s)).toEqual([]);
    expect(routeLive(ev('0xt2', '0x8000', OTHER, 1), s)).toEqual([]);
    expect(routeLive(ev('0xt3', KAMI, OTHER, 1), s)).toHaveLength(1);
    expect(s.emittedEntities.has('0x8000')).toBe(false);
  });

  it('a child created on a held pre-existing entity stays held', () => {
    const s = routeState();
    routeLive(ev('0xt1', EXISTING, WALK_IDS.IDOwnsKami, ACCOUNT), s);
    expect(routeLive(ev('0xt2', '0x9000', WALK_IDS.EntityType, 'HARVEST'), s)).toEqual([]);
    expect(routeLive(ev('0xt2', '0x9000', IdHolder, EXISTING), s)).toEqual([]);
    expect(routeLive(ev('0xt3', KAMI, OTHER, 1), s)).toHaveLength(1);
    expect(s.emittedEntities.has('0x9000')).toBe(false);
  });

  it("(c) after SetAccount the old player's new entities are held and the new player's pass", () => {
    const s = routeState();
    const NEXT = '0xb0b';
    s.accountId = NEXT;
    s.playerIds = new Set([NEXT]);

    expect(routeLive(ev('0xt1', '0x5000', WALK_IDS.EntityType, 'KAMI'), s)).toEqual([]);
    expect(routeLive(ev('0xt1', '0x5000', WALK_IDS.IDOwnsKami, ACCOUNT), s)).toEqual([]);
    const created = ev('0xt2', '0x6000', WALK_IDS.EntityType, 'KAMI');
    const owner = ev('0xt2', '0x6000', WALK_IDS.IDOwnsKami, NEXT);
    expect(routeLive(created, s)).toEqual([]);
    expect(routeLive(owner, s)).toEqual([]);
    expect(s.playerIds.has('0x6000')).toBe(true);

    const next = ev('0xt3', NEXT, OTHER, 1);
    expect(routeLive(next, s)).toEqual([created, owner]);
    expect(s.emittedEntities.has('0x5000')).toBe(false);
  });

  it('(d) after the final merge everything is emitted', () => {
    const s = routeState();
    s.merged = true;
    const unrelated = ev('0xt1', '0x7000', OTHER, 1);
    const transferred = ev('0xt1', EXISTING, WALK_IDS.IDOwnsKami, ACCOUNT);
    expect(routeLive(unrelated, s)).toEqual([unrelated]);
    expect(routeLive(transferred, s)).toEqual([transferred]);
  });
});
