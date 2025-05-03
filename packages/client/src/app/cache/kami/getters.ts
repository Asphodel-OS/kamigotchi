import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { NullAccount, queryKamiAccount } from 'network/shapes/Account';
import { hasFlag } from 'network/shapes/Flag';
import { NullHarvest } from 'network/shapes/Harvest';
import { KamiBattles, KamiSkills, queryKamiHarvest, queryKamiTraits } from 'network/shapes/Kami';
import { getSkills } from 'network/shapes/Kami/skills';
import { queryKillsForKiller, queryKillsForVictim } from 'network/shapes/Kill';
import { AccountOptions, getAccount } from '../account';
import { getHarvest } from '../harvest';
import { getKill } from '../kills';
import { getTrait } from '../trait';

/**
 * gets other nested objects attached to a kami entity
 */

export const KamiToOwner = new Map<EntityIndex, EntityIndex>(); // kami entity -> owner entity
export const KamiToHarvest = new Map<EntityIndex, EntityIndex>(); // kami entity -> harvest entity

// get the Account object that owns a Kami entity
export const getKamiAccount = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  options?: AccountOptions
) => {
  const accountEntity = queryKamiAccount(world, comps, entity);
  if (!accountEntity) return NullAccount;
  return getAccount(world, comps, accountEntity, options);
};

// get the Battles a Kami has participated in
export const getKamiBattles = (
  world: World,
  comps: Components,
  entity: EntityIndex
): KamiBattles => {
  const killEntities = queryKillsForKiller(world, comps, entity);
  const deathEntities = queryKillsForVictim(world, comps, entity);
  return {
    kills: killEntities.map((killEntity) => getKill(world, comps, killEntity)),
    deaths: deathEntities.map((deathEntity) => getKill(world, comps, deathEntity)),
  };
};

// get the Flags settings for a Kami entity
// TODO: implement cache for flags
export const getKamiFlags = (world: World, comps: Components, entity: EntityIndex) => {
  return {
    namable: !hasFlag(world, comps, entity, 'NOT_NAMEABLE'),
    skillReset: hasFlag(world, comps, entity, 'CAN_RESET_SKILLS'),
  };
};

// get the Harvest object for a Kami entity
// NOTE: we set the live update flag based on the context we expect to want this for a Kami
export const getKamiHarvest = (world: World, comps: Components, entity: EntityIndex) => {
  if (!entity) return NullHarvest;
  const harvestEntity = queryKamiHarvest(world, entity);
  if (!harvestEntity) return NullHarvest; // not expecting this but prevents crashes
  return getHarvest(world, comps, harvestEntity, { live: 2, node: 2 });
};

// get the Skill investment objects for a Kami entity
export const getKamiSkills = (world: World, comps: Components, entity: EntityIndex): KamiSkills => {
  return getSkills(world, comps, entity);
};

// get the Traits object for a Kami entity
export const getKamiTraits = (world: World, comps: Components, entity: EntityIndex) => {
  const traitEntities = queryKamiTraits(comps, entity);
  return {
    background: getTrait(world, comps, traitEntities.background),
    body: getTrait(world, comps, traitEntities.body),
    color: getTrait(world, comps, traitEntities.color),
    face: getTrait(world, comps, traitEntities.face),
    hand: getTrait(world, comps, traitEntities.hand),
  };
};
