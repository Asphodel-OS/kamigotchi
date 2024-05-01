import { World } from '@mud-classic/recs';
import { Components } from 'layers/network';
import { DetailedEntity } from './EntityTypes';

import { helpIcon, questsIcon } from 'assets/images/icons/menu';
import musuIcon from 'assets/images/icons/musu.png';

import moment from 'moment';
import { getItemByIndex } from '../Item';
import { getQuestByIndex } from '../Quest';
import { getSkillByIndex } from '../Skill';

// DetailedEntity wrapper for $MUSU representation
export const MUSUEntity: DetailedEntity = {
  ObjectType: 'COIN',
  image: musuIcon,
  name: '$MUSU',
};

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
  if (type === 'COIN') return MUSUEntity;
  else if (type === 'ITEM') return getItemByIndex(world, components, index);
  else if (type === 'SKILL') return getSkillByIndex(world, components, index, optionsPassthrough);
  else if (type === 'QUEST')
    return {
      ObjectType: 'QUEST',
      image: questsIcon,
      name: getQuestByIndex(world, components, index)?.name ?? `Quest ${index}`,
    };
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
