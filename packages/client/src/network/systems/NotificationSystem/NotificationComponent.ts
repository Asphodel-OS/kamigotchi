import { defineComponent, World, Type, Component, Metadata, SchemaOf } from "@mud-classic/recs";

export function defineNotificationComponent<T = undefined>(world: World) {
  const Notification = defineComponent(
    world,
    {
      title: Type.String,
      description: Type.String,
      time: Type.String,
      modal: Type.OptionalString,
    },
    { id: "Notification" }
  );
  return Notification as Component<SchemaOf<typeof Notification>, Metadata, T>;
}
