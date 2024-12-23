import { EntityID } from '@mud-classic/recs';

import { Skill } from './types';

export const NullSkill: Skill = {
  ObjectType: 'SKILL',
  id: '0' as EntityID,
  index: 0,
  name: '',
  description: '',
  image: '',
  cost: 0,
  max: 0,
  tier: 0,
  type: 'NONE',
  bonuses: [],
  requirements: [],
};
