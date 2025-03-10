import { World } from '@mud-classic/recs';
import * as placeholder from 'assets/images/icons/placeholder.png';
import { Components } from 'network/components';
import { Allo } from '.';
import { getBonusesByParent, parseBonusText } from '../Bonus';
import { getDTDetails, NullDT } from '../Droptable';
import { NullStat } from '../Stats';
import {
  capitalize,
  DetailedEntity,
  getDescribedEntity,
  getStatImage,
  parseQuantity,
  parseQuantityStat,
  parseStatTypeFromIndex,
} from '../utils';

export const parseAllos = (
  world: World,
  components: Components,
  allos: Allo[],
  flattenDT?: boolean
): DetailedEntity[] => {
  const raw = allos.map((allo) => parseAllo(world, components, allo, flattenDT));
  return raw.flat();
};

export const parseAllo = (
  world: World,
  components: Components,
  allo: Allo,
  flattenDT?: boolean
): DetailedEntity | DetailedEntity[] => {
  if (allo.type === 'BONUS') {
    return parseBonus(world, components, allo);
  } else if (allo.droptable) {
    if (flattenDT) return parseDroptableIndividual(world, components, allo);
    else return parseDroptable(world, components, allo);
  } else if (allo.stat) return parseStat(allo);
  else return parseBasic(world, components, allo);
};

////////////////
// INTERNAL

const parseBasic = (world: World, components: Components, allo: Allo): DetailedEntity => {
  const details = getDescribedEntity(world, components, allo.type, allo.index);
  let description = '';
  if (allo.type === 'STATE') description = parseState(details);
  else if (allo.type.includes('FLAG_')) {
    description = parseFlag(allo);
  } else description = '+' + parseQuantity(details, allo.value);

  return {
    ...details,
    description,
  };
};

const parseBonus = (world: World, components: Components, allo: Allo): DetailedEntity[] => {
  const bonuses = getBonusesByParent(world, components, allo.id);
  return bonuses.map((bonus) => ({
    ObjectType: 'BONUS',
    name: parseBonusText(bonus),
    description: parseBonusText(bonus),
    image: placeholder,
  }));
};

const parseDroptable = (world: World, components: Components, allo: Allo): DetailedEntity => {
  const dt = allo.droptable ?? NullDT;
  const all = getDTDetails(world, components, dt);

  // consolidate individual entries into one
  return {
    ObjectType: 'DROPTABLE',
    image: placeholder,
    name: 'Potential drops',
    description: all.map((entry) => `${entry.name} [${entry.description}]`).join('\n'),
  };
};

const parseDroptableIndividual = (
  world: World,
  components: Components,
  allo: Allo
): DetailedEntity[] => {
  const dt = allo.droptable ?? NullDT;
  return getDTDetails(world, components, dt);
};

const parseStat = (allo: Allo): DetailedEntity => {
  const stat = allo.stat ?? NullStat;

  const name = capitalize(parseStatTypeFromIndex(allo.index));
  const quantity = '+' + parseQuantityStat(name, stat);

  return {
    ObjectType: 'STAT',
    image: getStatImage(name),
    name,
    description: quantity,
  };
};

///////////////
// SPECIFIC CASES

const parseState = (details: DetailedEntity): string => {
  const capsState = details.name.toUpperCase();
  let description = '';
  if (capsState === 'RESTING') description = 'Revive';
  else if (capsState === 'DEAD') description = 'Kill';
  else if (capsState === '721_EXTERNAL') description = 'Send out of this world';
  return description;
};

const parseFlag = (allo: Allo): string => {
  console.log(allo);
  if (allo.type.toUpperCase() === 'FLAG_NOT_NAMEABLE')
    return 'Enable kami renaming'; // rename potion, set namable
  else if (allo.type.toUpperCase() === 'FLAG_CAN_RESET_SKILLS')
    return 'Enable skill reset'; // rename potion, set not namable
  else return 'Set ' + allo.type.toLowerCase().replaceAll('_', ' ');
};
