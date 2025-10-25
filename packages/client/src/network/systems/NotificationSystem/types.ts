import { ValueOf } from '@mud-classic/utils';
import { Components, EntityID, EntityIndex, Override, SchemaOf } from 'engine/recs';

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
