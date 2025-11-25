import { defineComponent, Metadata, Type, World } from 'engine/recs';

export function defineBoolComponent(world: World, name: string, contractId: string) {
  return defineComponent<{ value: Type.Boolean }, Metadata>(
    world,
    { value: Type.Boolean },
    { id: name, metadata: { contractId: contractId } }
  );
}
