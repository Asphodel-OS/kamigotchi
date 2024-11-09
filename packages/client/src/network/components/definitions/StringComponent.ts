import { defineComponent, Metadata, Type, World } from '@mud-classic/recs';

export function defineStringComponent(world: World, name: string, contractId: string) {
  return defineComponent<{ value: Type.String }, Metadata>(
    world,
    { value: Type.String },
    { id: name, metadata: { contractId: contractId }, indexed: true }
  );
}
