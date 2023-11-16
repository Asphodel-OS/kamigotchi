import { defineComponent, World, Type } from "@latticexyz/recs";

export function defineTimelockComponent(world: World) {
  return defineComponent(
    world,
    {
      target: Type.String,
      value: Type.Number,
      salt: Type.Number,
    },
    {
      id: "Timelock",
      metadata: {
        contractId: "component.Timelock",
      },
    }
  );
}