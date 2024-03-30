import { defineComponent, Type, World } from '@mud-classic/recs';

export type LocationComponent = ReturnType<typeof defineLocationComponent>;

export function defineLocationComponent(world: World, name: string, contractId: string) {
  return defineComponent(
    world,
    {
      x: Type.Number,
      y: Type.Number,
      z: Type.Number,
    },
    {
      id: name,
      metadata: {
        contractId: contractId,
      },
    }
  );
}
