import { Type, World, defineComponent } from '@mud-classic/recs';

export function defineTimelockComponent(world: World, name: string, contractId: any) {
  return defineComponent(
    world,
    {
      target: Type.String,
      value: Type.Number,
      salt: Type.Number,
    },
    {
      id: name,
      metadata: {
        contractId: contractId,
      },
    }
  );
}
