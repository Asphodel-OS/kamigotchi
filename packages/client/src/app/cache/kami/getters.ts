import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { NullAccount, queryKamiAccount } from 'network/shapes/Account';
import { hasFlag } from 'network/shapes/Flag';
import { NullHarvest } from 'network/shapes/Harvest';
import { KamiBattles, KamiSkills, queryKamiHarvest, queryKamiTraits } from 'network/shapes/Kami';
import { queryKillsForKiller, queryKillsForVictim } from 'network/shapes/Kill';
import { queryHolderSkills } from 'network/shapes/Skill';
import { getSkillPoints } from 'network/shapes/utils/component';
import { AccountOptions, getAccount } from '../account';
import { getHarvest } from '../harvest';
import { getKill } from '../kills';
import { getSkill } from '../skill';
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
  const id = world.entities[entity];
  return {
    namable: !hasFlag(world, comps, id, 'NOT_NAMEABLE'),
    skillReset: hasFlag(world, comps, id, 'CAN_RESET_SKILLS'),
  };
};

// get the Harvest object for a Kami entity
// NOTE: we set the live update flag based on the context we expect to want this for a Kami
export const getKamiHarvest = (world: World, comps: Components, entity: EntityIndex) => {
  const harvestEntity = queryKamiHarvest(world, entity);
  if (!harvestEntity) return NullHarvest; // not expecting this but prevents crashes
  return getHarvest(world, comps, harvestEntity, { live: 2 })!;
};

// not yet optimized around querying
// TODO: retrieve the number of points invested in each skill
// TODO: put some controls in place to smart refresh parts of a skill on demand
export const getKamiSkills = (world: World, comps: Components, entity: EntityIndex): KamiSkills => {
  const id = world.entities[entity];
  const skillEntities = queryHolderSkills(comps, id);
  const skills = skillEntities.map((skillEntity) => {
    return getSkill(world, comps, skillEntity);
  });
  return {
    tree: skills,
    points: getSkillPoints(comps, entity),
  };
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
