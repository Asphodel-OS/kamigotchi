import { defineComponent, World, Type, Component, Metadata, SchemaOf } from "@latticexyz/recs";

export function defineActionComponent<T = undefined>(world: World) {
  const Action = defineComponent(
    world,
    {
      action: Type.OptionalString,
      metadata: Type.OptionalT,
      on: Type.OptionalEntity,
      overrides: Type.OptionalStringArray,
      params: Type.OptionalEntityArray,
      state: Type.Number,
      time: Type.Number,
      txHash: Type.OptionalString,
    },
    { id: "Action" }
  );
  return Action as Component<SchemaOf<typeof Action>, Metadata, T>;
}
