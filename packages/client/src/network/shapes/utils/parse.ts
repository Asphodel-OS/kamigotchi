import { World } from '@mud-classic/recs';
import moment from 'moment';

import { helpIcon, questsIcon } from 'assets/images/icons/menu';
import { Components } from 'network/';
import { getFactionByIndex } from '../Faction';
import { getItemByIndex } from '../Item';
import { getQuestByIndex } from '../Quest';
import { getSkillByIndex } from '../Skill';
import { GachaTicket } from './EntityTypes';

// base shape of an entity with basic details
export interface DetailedEntity {
  ObjectType: string;
  image: string;
  name: string;
  description?: string;
}

/**
 * Gets an entity from a description (TYPE, INDEX)
 * @returns DetailedEntity, tries to return the full entity if possible
 */
export const getDescribedEntity = (
  world: World,
  components: Components,
  type: string,
  index: number,
  optionsPassthrough?: any
): DetailedEntity => {
  if (type === 'ITEM') return getItemByIndex(world, components, index);
  else if (type === 'SKILL') return getSkillByIndex(world, components, index, optionsPassthrough);
  else if (type === 'QUEST')
    return {
      ObjectType: 'QUEST',
      image: questsIcon,
      name: getQuestByIndex(world, components, index)?.name ?? `Quest ${index}`,
    };
  else if (type === 'FACTION') return getFactionByIndex(world, components, index);
  else if (type === 'REPUTATION') return getFactionByIndex(world, components, index);
  else if (type === 'MINT20')
    return GachaTicket; // hardcoded gacha ticket
  else return { ObjectType: type, image: helpIcon, name: type };
};

// parses and returns QuantityString from a DetailedEntity
export const parseQuantity = (entity: DetailedEntity, quantity?: number): string => {
  if (entity.ObjectType.includes('TIME')) return moment.duration((quantity ?? 0) * 1000).humanize();
  else if (entity.ObjectType === 'SKILL') {
    if (quantity && quantity > 0) return `level ${quantity * 1} ${entity.name}`;
    else return `cannot have ${entity.name}`;
  } else if (entity.ObjectType === 'LEVEL') return `level ${(quantity ?? 0) * 1}`;

  // default case - includes COIN, ITEM, QUEST
  return quantity !== undefined ? `${quantity * 1} ${entity.name}` : `${entity.name}`;
};
