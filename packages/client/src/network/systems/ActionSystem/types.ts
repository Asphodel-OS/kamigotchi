import { Components, EntityID, EntityIndex, Override, SchemaOf } from '@mud-classic/recs';
import { ValueOf } from '@mud-classic/utils';
import { ContractTransaction } from 'ethers';

export type ComponentUpdate<C extends Components> = ValueOf<{
  [key in keyof C]: {
    component: key;
    entity: EntityIndex;
    value: Override<SchemaOf<C[key]>>['value'];
  };
}>;

export type ActionRequest = {
  id?: EntityID; // Identifier of this action (entity ID, locally)
  index?: EntityIndex; // Index of the entity created for this action (locally)
  description: string; // Human readable description of the action
  action: string; // Action (name of system called)
  params: any[]; // Parameters to be passed to the execute function
  execute: () =>
    | Promise<ContractTransaction>
    | Promise<void>
    | Promise<{ hash: string; wait(): Promise<unknown> }>
    | void
    | undefined;

  // Flag to set if the queue should wait for the underlying transaction to be confirmed (in addition to being reduced)
  on?: EntityIndex; // the entity this action is related to.
  skipConfirmation?: boolean; // skip confirmation for this action
};
