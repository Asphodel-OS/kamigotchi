import { defineComponent, Type, World } from '@latticexyz/recs';

export function defineFarcasterDataComponent(world: World) {
  return defineComponent(
    world,
    {
      fid: Type.Number,
      username: Type.String,
      pfpURI: Type.String,
    },
    {
      id: 'FarcasterData',
      metadata: {
        contractId: 'components.Farcaster',
      },
    }
  );
}
