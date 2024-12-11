import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { NullAccount } from 'network/shapes/Account';
import { hasFlag } from 'network/shapes/Flag';
import { NullHarvest } from 'network/shapes/Harvest';
import { queryKamiHarvest, queryKamiTraits } from 'network/shapes/Kami';
import { queryHolderSkills } from 'network/shapes/Skill';
import { getKamiOwnerID, getSkillPoints } from 'network/shapes/utils/component';
import { AccountOptions, getAccount } from '../account';
import { getHarvest } from '../harvest';
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
  components: Components,
  entity: EntityIndex,
  options?: AccountOptions
) => {
  const ownerID = getKamiOwnerID(components, entity);
  const accountEntity = world.entityToIndex.get(ownerID);
  if (!accountEntity) return NullAccount;
  return getAccount(world, components, accountEntity, options);
};

// get the Flags settings for a Kami entity
export const getKamiFlags = (world: World, components: Components, entity: EntityIndex) => {
  const id = world.entities[entity];
  return {
    namable: !hasFlag(world, components, id, 'NOT_NAMEABLE'),
    skillReset: hasFlag(world, components, id, 'CAN_RESET_SKILLS'),
  };
};

// get the Harvest object for a Kami entity
// NOTE: we set the live update flag based on the context we expect to want this for a Kami
export const getKamiHarvest = (world: World, components: Components, entity: EntityIndex) => {
  const harvestEntity = queryKamiHarvest(world, entity);
  if (!harvestEntity) return NullHarvest; // not expecting this but prevents crashes
  return getHarvest(world, components, harvestEntity, { live: 2 })!;
};

// not yet optimized around querying
// TODO: retrieve the number of points invested in each skill
// TODO: put some controls in place to smart refresh parts of a skill on demand
export const getKamiSkills = (world: World, components: Components, entity: EntityIndex) => {
  const id = world.entities[entity];
  const skillEntities = queryHolderSkills(components, id);
  const skills = skillEntities.map((skillEntity) => {
    return getSkill(world, components, skillEntity);
  });
  return {
    tree: skills,
    points: getSkillPoints(components, entity),
  };
};

// get the Traits object for a Kami entity
export const getKamiTraits = (world: World, components: Components, entity: EntityIndex) => {
  const traitEntities = queryKamiTraits(components, entity);
  return {
    background: getTrait(world, components, traitEntities.background),
    body: getTrait(world, components, traitEntities.body),
    color: getTrait(world, components, traitEntities.color),
    face: getTrait(world, components, traitEntities.face),
    hand: getTrait(world, components, traitEntities.hand),
  };
};
