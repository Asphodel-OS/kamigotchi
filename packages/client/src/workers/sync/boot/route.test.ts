import { formatComponentID } from 'engine/utils';
import { id } from 'ethers';
import { describe, expect, it } from 'vitest';

import { NetworkEvents } from 'workers/types';
import { StateEvent } from '../state/types';
import { routeLive, RouteState } from './route';
import { WALK_IDS } from './walk';

const IdHolder = formatComponentID(id('component.id.holder'));
const OTHER = '0xc1';

const ACCOUNT = '0xa11ce';
const KAMI = '0x1000';
const NEW_KAMI = '0x2000';
const HARVEST = '0x3000';
const EXISTING = '0x4000';

const ev = (entity: string, component: string, value: unknown) =>
  ({
    type: NetworkEvents.NetworkComponentUpdate,
    component,
    entity,
    value: { value },
    blockNumber: 1,
  }) as unknown as StateEvent;

const routeState = (): RouteState => {
  const known = new Set([ACCOUNT, KAMI, EXISTING]);
  return {
    accountId: ACCOUNT,
    playerIds: new Set([ACCOUNT, KAMI]),
    emittedEntities: new Set([ACCOUNT, KAMI]),
    held: new Map(),
    isKnown: (id) => known.has(id),
    merged: false,
  };
};

describe('routeLive', () => {
  it('(a) a kami minted during boot, then harvested, is emitted before LIVE', () => {
    const s = routeState();
    const kamiType = ev(NEW_KAMI, WALK_IDS.EntityType, 'KAMI');
    const kamiOwner = ev(NEW_KAMI, WALK_IDS.IDOwnsKami, ACCOUNT);
    expect(routeLive(kamiType, s)).toEqual([]);
    expect(routeLive(kamiOwner, s)).toEqual([kamiType, kamiOwner]);
    expect(s.playerIds.has(NEW_KAMI)).toBe(true);

    const harvestType = ev(HARVEST, WALK_IDS.EntityType, 'HARVEST');
    const harvestHolder = ev(HARVEST, IdHolder, NEW_KAMI);
    const harvestRate = ev(HARVEST, '0xc2', 5);
    expect(routeLive(harvestType, s)).toEqual([]);
    expect(routeLive(harvestHolder, s)).toEqual([harvestType, harvestHolder]);
    expect(routeLive(harvestRate, s)).toEqual([harvestRate]);
    expect(s.held.size).toBe(0);
  });

  it('(b) an existing entity transferred to the player is held until the final merge', () => {
    const s = routeState();
    expect(routeLive(ev(EXISTING, WALK_IDS.IDOwnsKami, ACCOUNT), s)).toEqual([]);
    expect(routeLive(ev(EXISTING, OTHER, 'x'), s)).toEqual([]);
    expect(s.emittedEntities.has(EXISTING)).toBe(false);
    expect(s.playerIds.has(EXISTING)).toBe(false);
  });

  it('an unknown entity whose creation is not in the log is held on a link to the player', () => {
    const s = routeState();
    expect(routeLive(ev('0x8000', IdHolder, ACCOUNT), s)).toEqual([]);
    expect(routeLive(ev('0x8000', OTHER, 1), s)).toEqual([]);
    expect(s.emittedEntities.has('0x8000')).toBe(false);
  });

  it('a child created on a held pre-existing entity stays held', () => {
    const s = routeState();
    routeLive(ev(EXISTING, WALK_IDS.IDOwnsKami, ACCOUNT), s);
    expect(routeLive(ev('0x9000', WALK_IDS.EntityType, 'HARVEST'), s)).toEqual([]);
    expect(routeLive(ev('0x9000', IdHolder, EXISTING), s)).toEqual([]);
    expect(s.emittedEntities.has('0x9000')).toBe(false);
  });

  it("(c) after SetAccount the old player's new entities are held and the new player's pass", () => {
    const s = routeState();
    const NEXT = '0xb0b';
    s.accountId = NEXT;
    s.playerIds = new Set([NEXT]);

    expect(routeLive(ev('0x5000', WALK_IDS.EntityType, 'KAMI'), s)).toEqual([]);
    expect(routeLive(ev('0x5000', WALK_IDS.IDOwnsKami, ACCOUNT), s)).toEqual([]);
    const created = ev('0x6000', WALK_IDS.EntityType, 'KAMI');
    const next = ev('0x6000', WALK_IDS.IDOwnsKami, NEXT);
    expect(routeLive(created, s)).toEqual([]);
    expect(routeLive(next, s)).toEqual([created, next]);
    expect(s.playerIds.has('0x6000')).toBe(true);
  });

  it('(d) after the final merge everything is emitted', () => {
    const s = routeState();
    s.merged = true;
    const unrelated = ev('0x7000', OTHER, 1);
    const transferred = ev(EXISTING, WALK_IDS.IDOwnsKami, ACCOUNT);
    expect(routeLive(unrelated, s)).toEqual([unrelated]);
    expect(routeLive(transferred, s)).toEqual([transferred]);
  });
});
