import { Components, EntityIndex, Override, SchemaOf } from '@mud-classic/recs';
import { ValueOf } from '@mud-classic/utils';
import { DTCommit } from 'network/shapes/Droptable';

export type ComponentUpdate<C extends Components> = ValueOf<{
  [key in keyof C]: {
    component: key;
    entity: EntityIndex;
    value: Override<SchemaOf<C[key]>>['value'];
  };
}>;

export interface CommitData extends DTCommit {
  failures: number; // used to filter out bad commits
}
