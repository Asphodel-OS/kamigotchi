import { duplicateRoomMusic } from '../../../constants/phaser/rooms';

export function checkDuplicateRooms(currentRoom: number, prevRoom: number) {
  for (let i = 0; i < duplicateRoomMusic.length; i++) {
    const subarray = duplicateRoomMusic[i];
    if (subarray.includes(currentRoom) && subarray.includes(prevRoom)) {
      return true;
    }
  }
  return false;
}
