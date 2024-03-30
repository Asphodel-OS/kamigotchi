import { defineComponent, Metadata, Type, World } from '@mud-classic/recs';

export type CoordComponent = ReturnType<typeof defineCoordComponent>;

export function defineCoordComponent<M extends Metadata>(
  world: World,
  options?: { id?: string; metadata?: M; indexed?: boolean }
) {
  return defineComponent<{ x: Type.Number; y: Type.Number }, M>(
    world,
    { x: Type.Number, y: Type.Number },
    options
  );
}
