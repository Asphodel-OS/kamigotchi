import { defineComponent, Type, World } from "@mud-classic/recs";

export function defineStringArrayComponent(world: World, name: string, contractId: string) {
  return defineComponent(
    world,
    {
      value: Type.StringArray,
    },
    {
      id: name,
      metadata: {
        contractId: contractId,
      },
    }
  );
}
