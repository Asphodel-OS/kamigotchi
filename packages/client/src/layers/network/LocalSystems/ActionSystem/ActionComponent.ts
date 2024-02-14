import { Component, Metadata, SchemaOf, Type, World, defineComponent } from '@latticexyz/recs';

export function defineActionComponent<T = undefined>(world: World) {
  const Action = defineComponent(
    world,
    {
      action: Type.OptionalString,
      description: Type.String,
      params: Type.OptionalEntityArray,
      metadata: Type.OptionalT,
      on: Type.OptionalEntity,
      overrides: Type.OptionalStringArray,
      state: Type.Number,
      time: Type.Number,
      txHash: Type.OptionalString,
    },
    { id: 'Action' }
  );
  return Action as Component<SchemaOf<typeof Action>, Metadata, T>;
}
