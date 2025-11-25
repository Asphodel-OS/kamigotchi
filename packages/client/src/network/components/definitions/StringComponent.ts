import { defineComponent, Metadata, Type, World } from 'engine/recs';

export function defineStringComponent(
  world: World,
  name: string,
  contractId: string,
  indexed?: boolean
) {
  return defineComponent<{ value: Type.String }, Metadata>(
    world,
    { value: Type.String },
    { id: name, metadata: { contractId: contractId }, indexed: indexed }
  );
}
