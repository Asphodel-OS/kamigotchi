import { EntityIndex, getComponentValue } from 'engine/recs';

import { Components } from 'network/components';

export const getBio = (components: Components, entity: EntityIndex): string => {
  const { Description } = components;
  return (getComponentValue(Description, entity)?.value as string) ?? '';
};
