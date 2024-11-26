import { World } from '@mud-classic/recs';
import * as placeholder from 'assets/images/icons/placeholder.png';
import { Components } from 'network/components';
import { Allo } from '.';
import { getDTDetails, NullDT } from '../Droptable';
import { NullStat } from '../Stats';
import {
  capitalize,
  DetailedEntity,
  getDescribedEntity,
  getStatImage,
  parseKamiStateFromIndex,
  parseQuantity,
} from '../utils';

export const parseAllos = (
  world: World,
  components: Components,
  allos: Allo[],
  flatten?: boolean
): DetailedEntity[] => {
  const raw = allos.map((allo) => parseAllo(world, components, allo, flatten));
  return raw.flat();
};

export const parseAllo = (
  world: World,
  components: Components,
  allo: Allo,
  flatten?: boolean
): DetailedEntity | DetailedEntity[] => {
  if (allo.droptable) {
    if (flatten) return parseDroptableIndividual(world, components, allo);
    else return parseDroptable(world, components, allo);
  } else if (allo.stat) return parseStat(allo);
  else return parseBasic(world, components, allo);
};

////////////////
// INTERNAL

const parseBasic = (world: World, components: Components, allo: Allo): DetailedEntity => {
  const details = getDescribedEntity(world, components, allo.type, allo.index);
  return {
    ...details,
    description: parseQuantity(details, allo.value),
  };
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

  const name = capitalize(parseKamiStateFromIndex(allo.index));

  let quantity = '';
  if (stat.shift > 0) quantity += `+${stat.shift} max `;
  if (stat.sync > 0) quantity += `+${stat.sync}`;
  quantity = quantity.trim();

  return {
    ObjectType: 'STAT',
    image: getStatImage(name),
    name,
    description: quantity,
  };
};
