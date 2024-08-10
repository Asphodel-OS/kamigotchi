import { defineComponent, Type, World } from '@mud-classic/recs';

export function defineDescriptorComponent(world: World, name: string, id: string) {
  return defineComponent(
    world,
    {
      type: Type.String,
      name: Type.OptionalString,
      subtype: Type.OptionalString,
      index: Type.OptionalNumber,
      value: Type.OptionalString,
    },
    { id: name, metadata: { contractId: id } }
  );
}
