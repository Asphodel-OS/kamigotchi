import { defineComponent, Metadata, Type, World } from '@mud-classic/recs';

export function defineNumberComponent(world: World, name: string, contractId: string) {
  return defineComponent<{ value: Type.Number }, Metadata>(
    world,
    { value: Type.Number },
    { id: name, metadata: { contractId: contractId }, indexed: true }
  );
}
