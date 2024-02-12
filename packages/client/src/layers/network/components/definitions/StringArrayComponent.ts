import { defineComponent, Type, World } from '@latticexyz/recs';

export function defineStringArrayComponent(
  world: World,
  name: string,
  contractId: string
) {
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
