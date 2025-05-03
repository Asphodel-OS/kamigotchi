import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  getKami,
  getKamiBonuses,
  getKamiConfigs,
  getKamiProgress,
  getKamiStats,
  getKamiTimes,
  Kami,
} from 'network/shapes/Kami';
import { getHealth } from 'network/shapes/Kami/stats';
import {
  getLastActionTime,
  getLastTime,
  getRerolls,
  getState,
} from 'network/shapes/utils/component';
import { updateHarvestRate, updateHealthRate } from './calcs';
import { getKamiFlags, getKamiHarvest, getKamiSkills, getKamiTraits } from './getters';

// Kami caches and Kami cache checkers
export const KamiCache = new Map<EntityIndex, Kami>(); // kami entity -> kami

const LiveUpdateTs = new Map<EntityIndex, number>(); // last update of the live sub-object (s)
// const BattlesUpdateTs = new Map<EntityIndex, number>(); // last update of the battles sub-object (s)
const BonusesUpdateTs = new Map<EntityIndex, number>(); // last update of the bonuses sub-object (s)
const ConfigsUpdateTs = new Map<EntityIndex, number>(); // last update of the config sub-object (s)
const FlagsUpdateTs = new Map<EntityIndex, number>(); // last update of the flags sub-object (s)
const HarvestUpdateTs = new Map<EntityIndex, number>(); // last update of the harvest sub-object (s)
const ProgressUpdateTs = new Map<EntityIndex, number>(); // last update of the progress sub-object (s)
const RerollsUpdateTs = new Map<EntityIndex, number>(); // last update of the rerolls sub-object (s)
const SkillsUpdateTs = new Map<EntityIndex, number>(); // last update of the skills sub-object (s)
const StatsUpdateTs = new Map<EntityIndex, number>(); // last update of the stats sub-object (s)
const TimeUpdateTs = new Map<EntityIndex, number>(); // last update of the time sub-object (s)
const TraitsUpdateTs = new Map<EntityIndex, number>(); // last update of the traits sub-object (s)

// retrieve a kami's most recent data and update it on the cache
export const process = (world: World, components: Components, entity: EntityIndex) => {
  const kami = getKami(world, components, entity);
  KamiCache.set(entity, kami);
  return kami;
};

// stale limit to refresh data (seconds)
export interface RefreshOptions {
  live?: number;
  // battles?: number;
  bonuses?: number;
  config?: number;
  flags?: number;
  harvest?: number;
  progress?: number;
  rerolls?: number;
  skills?: number;
  stats?: number;
  time?: number;
  traits?: number;
}

// get a kami from the cache or poll the live data
export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: RefreshOptions,
  debug?: boolean
) => {
  if (!KamiCache.has(entity)) process(world, components, entity);
  const kami = KamiCache.get(entity)!;
  if (debug) console.log(`===retrieving kami ${kami.index} ${kami.name}===`);
  if (!options) return kami;

  const now = Date.now();

  // populate the live changing fields
  if (options.live != undefined) {
    const updateTs = LiveUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.live) {
      if (debug) console.log(`  updating live kami state`);
      kami.state = getState(components, entity);
      kami.time = {
        start: kami.time?.start ?? 0,
        last: getLastTime(components, entity, debug),
        cooldown: getLastActionTime(components, entity, debug),
      };

      // populate health if it's defined
      if (kami.stats) kami.stats.health = getHealth(world, components, entity);
      LiveUpdateTs.set(entity, now);
    }
  }

  // if (options.battles != undefined) {
  //   const updateTs = BattlesUpdateTs.get(entity) ?? 0;
  //   const updateDelta = (now - updateTs) / 1000; // convert to seconds
  //   if (updateDelta > options.battles) {
  //     if (debug) console.log(`  updating kami battles`);
  //     kami.battles = getKamiBattles(world, components, entity);
  //     BattlesUpdateTs.set(entity, now);
  //   }
  // }

  // requires keccak id and trad querying, followed by component updates
  if (options.bonuses != undefined) {
    const updateTs = BonusesUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.bonuses) {
      if (debug) console.log(`  updating kami bonuses`);
      kami.bonuses = getKamiBonuses(world, components, entity);
      BonusesUpdateTs.set(entity, now);
    }
  }

  // requires keccak id and component pulls (but cached only one)
  // TODO: cache and trigger updates to these more globally
  if (options.config != undefined) {
    const updateTs = ConfigsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.config) {
      if (debug) console.log(`  updating kami config`);
      kami.config = getKamiConfigs(world, components);
      ConfigsUpdateTs.set(entity, now);
    }
  }

  // requires keccak id and component pull
  if (options.flags != undefined) {
    const updateTs = FlagsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.flags) {
      if (debug) console.log(`  updating kami flags`);
      kami.flags = getKamiFlags(world, components, entity);
      FlagsUpdateTs.set(entity, now);
    }
  }

  // requires keccak id and is its own entity type with potential subtypes (node)
  // Q: should caching staleness be checked at this level or one/two below?
  if (options.harvest != undefined) {
    const updateTs = HarvestUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.harvest) {
      kami.harvest = getKamiHarvest(world, components, entity);
      if (debug) console.log(`  updating kami harvest`, kami.harvest);

      // NOTE: this pattern is a remnant for how calcs are currently run
      // ideally we want to flatten the shapes and avoid automatically populating
      // the nested Node object this way
      if (kami.harvest && kami.harvest.state === 'ACTIVE') {
        updateHarvestRate(kami);
      }
      HarvestUpdateTs.set(entity, now);
    }
  }

  // requires strictly component pulls (given lazy eval of exp requirement)
  if (options.progress != undefined) {
    const updateTs = ProgressUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.progress) {
      if (debug) console.log(`  updating kami progress`);
      kami.progress = getKamiProgress(components, entity);
      ProgressUpdateTs.set(entity, now);
    }
  }

  // requires strictly component pulls
  if (options.rerolls != undefined) {
    const updateTs = RerollsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.rerolls) {
      if (debug) console.log(`  updating kami rerolls`);
      kami.rerolls = getRerolls(components, entity);
      RerollsUpdateTs.set(entity, now);
    }
  }

  // requires trad queries to registry entities (but cached only once)
  // however requires update of values after caching
  if (options.skills != undefined) {
    const updateTs = SkillsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.skills) {
      if (debug) console.log(`  updating kami skills`);
      kami.skills = getKamiSkills(world, components, entity);
      SkillsUpdateTs.set(entity, now);
    }
  }

  // requires strictly component pulls + potentially bonuses
  if (options.stats != undefined) {
    const updateTs = StatsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.stats) {
      if (debug) console.log(`  updating kami stats`);
      kami.stats = getKamiStats(world, components, entity, true);
      StatsUpdateTs.set(entity, now);
    }
  }

  // requires component pulls
  if (options.time != undefined) {
    const updateTs = TimeUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.time) {
      if (debug) console.log(`  updating kami times`);
      kami.time = getKamiTimes(components, entity);
      TimeUpdateTs.set(entity, now);
    }
  }

  // requires trad queries to registry entities (but cached only once)
  if (options.traits != undefined) {
    const updateTs = TraitsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.traits) {
      if (debug) console.log(`  updating kami traits`);
      kami.traits = getKamiTraits(world, components, entity);
      TraitsUpdateTs.set(entity, now);
    }
  }

  if (debug) console.log(`  updating health rate`);
  updateHealthRate(kami);
  if (debug) console.log(`finished retrieving kami ${kami.index} ${kami.name}`);
  return kami;
};
