import { getKamidenClient, Message } from '../../../clients/kamiden/index';

// nodeindex ,messages list
export const ChatCache = new Map<number, Message[]>();
const client = getKamidenClient();

export const get = async (roomIndex: number, scroll: boolean) => {
  if (!ChatCache.has(roomIndex) || scroll) await process(roomIndex, scroll);
  return ChatCache.get(roomIndex)!;
};

// !scroll (user hasnt scrolled yet)
// scroll(user  has scrolled, older messages neeed to be loaded)
export const process = async (roomIndex: number, scroll: boolean) => {
  if (!scroll) {
    const response = await client.getRoomMessages({
      RoomIndex: roomIndex,
      Timestamp: Date.now(),
    });

    ChatCache.set(roomIndex, response.Messages);
  } else {
    const newMessages = ChatCache.get(roomIndex);
    const response = await client.getRoomMessages({
      RoomIndex: roomIndex,
      Timestamp: newMessages?.[0]?.Timestamp,
    });
    ChatCache.set(roomIndex, response.Messages.concat(newMessages!));
  }
};

export const push = (newMessage: Message) => {
  const oldMessages = ChatCache.get(newMessage.RoomIndex);
  if (!oldMessages || oldMessages.length === 0) return;
  ChatCache.set(newMessage.RoomIndex, oldMessages.concat(newMessage!));
};

export const getLastTimeStamp = (roomIndex: number) => {
  const len = ChatCache.get(roomIndex)?.length;
  if (len) {
    return ChatCache.get(roomIndex)?.[len - 1]?.Timestamp ?? 0;
  }
  return 0;
};
