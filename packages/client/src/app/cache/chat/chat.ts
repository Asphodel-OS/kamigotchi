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
  var roomMessages = ChatCache.get(newMessage.RoomIndex);
  if (roomMessages) {
    ChatCache.set(newMessage.RoomIndex, roomMessages.concat(newMessage));
  } else {
    get(newMessage.RoomIndex, false);
  }
};

export const getLastTimeStamp = (roomIndex: number) => {
  const len = ChatCache.get(roomIndex)?.length;
  if (len) {
    return ChatCache.get(roomIndex)?.[len - 1]?.Timestamp ?? 0;
  }
  return 0;
};

export const getNumberNewMessages = (roomIndex: number, lastTimeStamp: number) => {
  const fullLength = ChatCache.get(roomIndex)?.length ?? 0;
  const lastVisitedPosition =
    ChatCache.get(roomIndex)?.findIndex((message) => message.Timestamp >= lastTimeStamp) ?? 0;
  const numberNewMessages = fullLength - lastVisitedPosition;
  if (numberNewMessages > 10) return '+10';
  else return numberNewMessages;
};
