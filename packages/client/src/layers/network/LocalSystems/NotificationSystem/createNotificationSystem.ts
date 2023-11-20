import {
  World,
  createEntity,
  getComponentValue,
  updateComponent,
  EntityID,
  EntityIndex,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { NotificationData } from "./types";
import { defineNotificationComponent } from "./NotificationComponent";

export type NotificationSystem = ReturnType<typeof createNotificationSystem>;

export function createNotificationSystem<M = undefined>(world: World) {
  // Notification component
  const Notification = defineNotificationComponent<M>(world);

  function add(toAdd: NotificationData): EntityIndex {
    // Set the action component
    const entityIndex = createEntity(world, undefined, {
      id: toAdd.id,
    });

    setComponent(Notification, entityIndex, {
      title: toAdd.title,
      description: toAdd.description,
      time: toAdd.time.toString(),
      modal: toAdd.modal,
    });

    return entityIndex;
  }

  function remove(id: EntityID): boolean {
    if (world.entityToIndex.get(id) == undefined || !getComponentValue(Notification, world.entityToIndex.get(id)!)) {
      console.warn(`Notification ${id} was not found`);
      return false;
    }
    removeComponent(Notification, world.entityToIndex.get(id)!);
    return true;
  }

  function update(id: EntityID, toUpdate: Partial<NotificationData>) {
    const index = world.entityToIndex.get(id);
    if (index == undefined || getComponentValue(Notification, index) == undefined) {
      console.warn(`Notification ${id} was not found`);
      return;
    }
    const curr = getComponentValue(Notification, index)!;
    updateComponent(Notification, index, { ...curr, ...toUpdate });
    return true;
  }

  function has(id: EntityID) {
    const index = world.entityToIndex.get(id);
    return index && getComponentValue(Notification, index);
  }

  return { add, remove, update, has, Notification };
}
