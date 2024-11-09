import { defineComponent, Metadata, Type, World } from '@mud-classic/recs';

export function defineNumberComponent(
  world: World,
  name: string,
  contractId: string,
  indexed?: boolean
) {
  return defineComponent<{ value: Type.Number }, Metadata>(
    world,
    { value: Type.Number },
    { id: name, metadata: { contractId: contractId }, indexed: indexed }
  );
}
