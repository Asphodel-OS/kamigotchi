import { Type, World, defineComponent } from 'engine/recs';

export function defineLoadingStateComponent(world: World) {
  return defineComponent(
    world,
    {
      state: Type.Number,
      msg: Type.String,
      percentage: Type.Number,
    },
    {
      id: 'LoadingState',
      metadata: {
        contractId: 'component.LoadingState',
      },
    }
  );
}
