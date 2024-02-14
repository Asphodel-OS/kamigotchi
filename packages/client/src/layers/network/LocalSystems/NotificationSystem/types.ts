import { Components, EntityID, EntityIndex, Override, SchemaOf } from '@latticexyz/recs';
import { ValueOf } from '@latticexyz/utils';

export type ComponentUpdate<C extends Components> = ValueOf<{
  [key in keyof C]: {
    component: key;
    entity: EntityIndex;
    value: Override<SchemaOf<C[key]>>['value'];
  };
}>;

export type NotificationData = {
  id?: EntityID;
  title: string;
  description: string;
  time: string;
  modal?: string;
};
