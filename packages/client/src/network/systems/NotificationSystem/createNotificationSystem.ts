import {
  World,
  createEntity,
  getComponentValue,
  updateComponent,
  EntityID,
  EntityIndex,
  removeComponent,
  setComponent,
} from "@mud-classic/recs";
import { NotificationData } from "./types";
import { defineNotificationComponent } from "./NotificationComponent";

export type NotificationSystem = ReturnType<typeof createNotificationSystem>;

export function createNotificationSystem<M = undefined>(world: World) {
  // Notification component
  const Notification = defineNotificationComponent<M>(world);

  /**
   * Adds a notification 
   * @param notification notification to be added
   * @returns index of the entity created for the action
   */
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

  /**
   * removes a notification
   * @param id ID of notification to be removed
   * @returns void
   */
  function remove(id: EntityID): boolean {
    const index = world.entityToIndex.get(id);
    if (index == undefined || getComponentValue(Notification, index) == undefined) {
      console.warn(`Notification ${id} was not found`);
      return false;
    }
    removeComponent(Notification, world.entityToIndex.get(id)!);
    return true;
  }

  /**
   * Updates a notification
   * @param id ID of notification to be updated
   * @returns void
   */
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
