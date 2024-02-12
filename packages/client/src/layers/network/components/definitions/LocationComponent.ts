import { defineComponent, Type, World } from '@latticexyz/recs';

export function defineLocationComponent(
  world: World,
  name: string,
  contractId: string
) {
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
