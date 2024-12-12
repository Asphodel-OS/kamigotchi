import { EntityIndex, getComponentValue, World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getConfigFieldValue, getConfigFieldValueArray } from '../Config';

export interface Progress {
  level: number;
  experience: number;
}

export const getProgress = (
  world: World,
  components: Components,
  entity: EntityIndex
): Progress => {
  const { Level, Experience } = components;
  const level = (getComponentValue(Level, entity)?.value ?? 0) * 1;
  return {
    level,
    experience: (getComponentValue(Experience, entity)?.value ?? 0) * 1,
  };
};

// experience threshold calculation according to level
// TODO: lazily evaluate this rather than saving it directly to object
export const calcExperienceRequirement = (
  world: World,
  components: Components,
  level: number
): number => {
  const experienceBase = getConfigFieldValue(world, components, 'KAMI_LVL_REQ_BASE');
  const expereinceExponentArr = getConfigFieldValueArray(
    world,
    components,
    'KAMI_LVL_REQ_MULT_BASE'
  );
  const experienceExponent = expereinceExponentArr[0];
  const exponentPrecision = 10 ** expereinceExponentArr[1];
  return Math.floor(
    experienceBase * ((1.0 * experienceExponent) / exponentPrecision) ** (level - 1)
  );
};
