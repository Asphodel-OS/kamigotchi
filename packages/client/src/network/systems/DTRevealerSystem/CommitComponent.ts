import { Component, defineComponent, Metadata, SchemaOf, Type, World } from '@mud-classic/recs';

export function defineCommitComponent<T = undefined>(world: World) {
  const Commit = defineComponent(
    world,
    {
      id: Type.Entity,
      block: Type.Number,
      type: Type.String,
      state: Type.Number,
      parentType: Type.OptionalString,
    },
    { id: 'Commit' }
  );
  return Commit as Component<SchemaOf<typeof Commit>, Metadata, T>;
}
