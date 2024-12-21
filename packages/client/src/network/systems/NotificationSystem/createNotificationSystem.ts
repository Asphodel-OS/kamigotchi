import {
  EntityID,
  EntityIndex,
  World,
  createEntity,
  getComponentValue,
  removeComponent,
  setComponent,
  updateComponent,
} from '@mud-classic/recs';
import { defineNotificationComponent } from './NotificationComponent';
import { NotificationData } from './types';

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
    const entity = createEntity(world, undefined, {
      id: toAdd.id,
    });

    setComponent(Notification, entity, {
      title: toAdd.title,
      description: toAdd.description,
      time: toAdd.time.toString(),
      modal: toAdd.modal,
    });

    return entity;
  }

  /**
   * removes a notification
   * @param id ID of notification to be removed
   * @returns void
   */
  function remove(id: EntityID | EntityIndex): boolean {
    const index = typeof id === 'string' ? world.entityToIndex.get(id) : id;
    if (index == undefined || getComponentValue(Notification, index) == undefined) {
      console.warn(`Notification ${id} was not found`);
      return false;
    }
    removeComponent(Notification, index!);
    return true;
  }

  /**
   * Updates a notification
   * @param id ID of notification to be updated
   * @returns void
   */
  function update(id: EntityID | EntityIndex, toUpdate: Partial<NotificationData>) {
    const index = typeof id === 'string' ? world.entityToIndex.get(id) : id;
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
