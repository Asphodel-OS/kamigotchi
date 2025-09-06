import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import moment from 'moment';

import { HelpIcon, QuestsIcon } from 'assets/images/icons/menu';
import * as placeholderIcon from 'assets/images/icons/placeholder.png';
import { Components } from 'network/';
import pluralize from 'pluralize';
import { getFactionByIndex, getReputationDetailsByIndex } from '../Faction';
import { getItemByIndex } from '../Item';
import { getQuestByIndex } from '../Quest';
import { getSkillByIndex } from '../Skill';
import { Stat } from '../Stats';
import { getDescription, getMediaURI, getName, getType } from './component';
import { capitalize } from './strings';

// base shape of an entity with basic details
export interface DetailedEntity {
  entity: EntityIndex;
  ObjectType: string;
  image: string;
  name: string;
  description?: string;
}

/**
 * Gets an entity from a description (TYPE, INDEX)
 * @returns DetailedEntity, tries to return the full entity if possible
 */
interface getArgs {
  world: World;
  components: Components;
  index: number;
  type?: string;
  options?: any;
}

export const getDetailedEntityByID = (
  world: World,
  components: Components,
  id: EntityID
): DetailedEntity => {
  const entity = world.entityToIndex.get(id);
  if (entity === undefined) {
    return { entity: 0 as EntityIndex, ObjectType: 'UNKNOWN', image: HelpIcon, name: 'Unknown' };
  }
  return getDetailedEntity(world, components, entity);
};

export const getDetailedEntity = (
  world: World,
  components: Components,
  entity: EntityIndex
): DetailedEntity => {
  const shape = getType(components, entity);
  const image = getImage(components, shape, entity);
  const name = getName(components, entity);
  const description = getDescription(components, entity);
  return { entity, ObjectType: shape, image, name, description };
};

export const getFromDescription = (
  world: World,
  components: Components,
  type: string,
  index: number,
  options?: any
): DetailedEntity => {
  const args: getArgs = { world, components, index, type, options };
  // if (descriptionMap.has(type))
  //   return descriptionMap.get(type)!({ world, components, index, type, options });
  if (type === 'ITEM') return getItem(args);
  else if (type === 'FACTION') return getFaction(args);
  else if (type === 'QUEST') return getQuest(args);
  else if (type === 'REPUTATION') return getReputation(args);
  else if (type === 'SKILL') return getSkill(args);
  else if (type === 'STATE') return getState(args);
  else return { entity: 0 as EntityIndex, ObjectType: type, image: HelpIcon, name: type };
};

// parses and returns QuantityString from a DetailedEntity
export const parseQuantity = (entity: DetailedEntity, quantity?: number): string => {
  if (entity.ObjectType.includes('TIME')) return moment.duration((quantity ?? 0) * 1000).humanize();
  else if (entity.ObjectType === 'SKILL') {
    if (quantity && quantity > 0) return `level ${quantity * 1} ${entity.name}`;
    else return `cannot have ${entity.name}`;
  } else if (entity.ObjectType === 'LEVEL') return `level ${(quantity ?? 0) * 1}`;
  else if (entity.ObjectType === 'COOLDOWN') return `${(quantity ?? 0) * 1}s cooldown`;
  if (entity.ObjectType === 'ITEM') {
    // filter out musu from pluralization
    if (entity.name.toLowerCase().includes('musu')) return `${(quantity ?? 0) * 1} ${entity.name}`;
    return pluralize(entity.name, (quantity ?? 0) * 1, true);
  }

  // default case - includes QUEST
  return quantity !== undefined ? `${quantity * 1} ${entity.name}` : `${entity.name}`;
};

export const parseQuantityStat = (rawType: string, stat: Stat): string => {
  const type = rawType.toUpperCase();
  let suffix = '';
  if (type === 'HEALTH') suffix = 'HP';
  else if (type === 'HARMONY') suffix = 'Harmony';
  else if (type === 'POWER') suffix = 'Power';
  else if (type === 'SLOTS') suffix = 'Slots';
  else if (type === 'STAMINA') suffix = 'Stamina';
  else if (type === 'VIOLENCE') suffix = 'Violence';

  const results: string[] = [];
  if (stat.shift > 0) results.push(`${stat.shift} max ${suffix}`);
  if (stat.sync > 0) results.push(`${stat.sync} ${suffix}`);

  return results.join(', ');
};

export const parseStatTypeFromIndex = (index: number): string => {
  if (index === 1) return 'HEALTH';
  else if (index === 2) return 'HARMONY';
  else if (index === 3) return 'POWER';
  else if (index === 4) return 'SLOTS';
  else if (index === 5) return 'STAMINA';
  else if (index === 6) return 'VIOLENCE';
  else return '';
};

export const parseKamiStateToIndex = (state: string): number => {
  if (state === 'RESTING') return 1;
  else if (state === 'HARVESTING') return 2;
  else if (state === 'DEAD') return 3;
  else if (state === '721_EXTERNAL') return 4;
  else return 0;
};

export const parseKamiStateFromIndex = (index: number): string => {
  if (index === 1) return 'RESTING';
  else if (index === 2) return 'HARVESTING';
  else if (index === 3) return 'DEAD';
  else if (index === 4) return '721_EXTERNAL';
  else return '';
};

export const parseKamiCanEatFromIndex = (index: number): string => {
  if (index === 1) return 'RESTING';
  else if (index === 2) return 'HARVESTING';
  else return 'None';
};

////////////////////////
// INTERNAL

const getImage = (components: Components, shape: string, entity: EntityIndex): string => {
  const raw = getMediaURI(components, entity);
  if (raw !== '') return raw;
  else if (shape === 'QUEST') return QuestsIcon;
  else return placeholderIcon;
};

function getItem(args: getArgs): DetailedEntity {
  return getItemByIndex(args.world, args.components, args.index);
}

function getFaction(args: getArgs): DetailedEntity {
  return getFactionByIndex(args.world, args.components, args.index);
}

function getQuest(args: getArgs): DetailedEntity {
  const quest = getQuestByIndex(args.world, args.components, args.index);
  return {
    ObjectType: 'QUEST',
    entity: quest?.entity ?? (0 as EntityIndex),
    image: QuestsIcon,
    name: quest?.name ?? `Quest ${args.index}`,
  };
}

function getReputation(args: getArgs): DetailedEntity {
  return getReputationDetailsByIndex(args.world, args.components, args.index);
}

function getSkill(args: getArgs): DetailedEntity {
  return getSkillByIndex(args.world, args.components, args.index);
}

function getState(args: getArgs): DetailedEntity {
  const state = parseKamiStateFromIndex(args.index);
  return {
    ObjectType: 'STATE',
    entity: 0 as EntityIndex,
    image: placeholderIcon,
    name: capitalize(state),
  };
}
