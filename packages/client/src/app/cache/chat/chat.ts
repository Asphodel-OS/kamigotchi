import { getKamidenClient, Message } from '../../../clients/kamiden/index';

// nodeindex ,messages list
export const ChatCache = new Map<number, Message[]>();
const client = getKamidenClient();

export const get = async (roomIndex: number, scroll: boolean) => {
  console.log(`[CHAT CACHE] GET room ${roomIndex} - scroll ${scroll}`);
  if (!ChatCache.has(roomIndex) || scroll) await process(roomIndex, scroll);
  return ChatCache.get(roomIndex)!;
};

// !scroll (user hasnt scrolled yet), !empty(user had already opened the chat modal), empty(user hadnt already opened the chat modal)
// scroll(user  has scrolled, old messages neeed to be loaded)
export const process = async (roomIndex: number, scroll: boolean) => {
  console.log(`[CHAT CACHE] PROCESS room ${roomIndex} - scroll ${scroll}`);
  if (!scroll) {
    console.log(`[CHAT CACHE] initial`);
    const response = await client.getRoomMessages({
      RoomIndex: roomIndex,
      Timestamp: Date.now(),
    });
    console.log(`[CHAT CACHE] hurdur`);
    ChatCache.set(roomIndex, response.Messages);
  } else {
    console.log(`[CHAT CACHE] scroll`);
    const newMessages = ChatCache.get(roomIndex);
    const response = await client.getRoomMessages({
      RoomIndex: roomIndex,
      Timestamp: newMessages?.[0]?.Timestamp,
    });
    ChatCache.set(roomIndex, response.Messages.concat(newMessages!));
  }
  console.log(`[CHAT CACHE] ${ChatCache.get(roomIndex)}`);
};

export const push = (newMessage: Message) => {
  console.log(`[CHAT CACHE] PUSH room ${newMessage.RoomIndex} - scroll ${scroll}`);
  const oldMessages = ChatCache.get(newMessage.RoomIndex);
  if (!oldMessages || oldMessages.length === 0) return;
  ChatCache.set(newMessage.RoomIndex, oldMessages.concat(newMessage!));
  console.log(`[CHAT CACHE] ${ChatCache.get(newMessage.RoomIndex)}`);
};
