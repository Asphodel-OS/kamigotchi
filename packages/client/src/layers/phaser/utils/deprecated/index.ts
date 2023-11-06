import { Component, EntityIndex, Metadata, Schema, getComponentValue } from '@mud-classic/recs';

export const hexToDecimal = (hex: string) => parseInt(hex, 16);

// NOTE: love this function, we should probably move it to the network layer
export const getCurrentRoom = (
  component: Component<Schema, Metadata, undefined>,
  entity: EntityIndex
): number => {
  const currentRoom = getComponentValue(component, entity);
  if (currentRoom) {
    const value = currentRoom.value as string;
    return hexToDecimal(value);
  }
  return 0;
};
