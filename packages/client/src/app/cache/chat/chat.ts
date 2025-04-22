import { getKamidenClient, Message } from '../../../clients/kamiden/index';

// nodeindex ,messages list
export const ChatCache = new Map<number, Message[]>();
const client = getKamidenClient();

export const get = async (roomIndex: number, append: boolean) => {
  if (!ChatCache.has(roomIndex) || append) await process(roomIndex, append);
  return ChatCache.get(roomIndex)!;
};

// !append (user hasnt scrolled yet)
// append(user has scrolled, older messages neeed to be loaded)
export const process = async (roomIndex: number, append: boolean) => {
  if (!append) {
    const response = await client.getRoomMessages({
      RoomIndex: roomIndex,
      Timestamp: Date.now(),
    });

    ChatCache.set(roomIndex, response.Messages);
  } else {
    const loadedMessages = ChatCache.get(roomIndex);
    const response = await client.getRoomMessages({
      RoomIndex: roomIndex,
      Timestamp: loadedMessages?.[0]?.Timestamp,
    });
    ChatCache.set(roomIndex, response.Messages.concat(loadedMessages!));
  }
};

// if the room has been visited before it appends the new message
// if the room has not been visited before it calls the get function (this will populate the cache with the messages of the room )
export const push = (newMessage: Message) => {
  var roomMessages = ChatCache.get(newMessage.RoomIndex);
  if (roomMessages) {
    ChatCache.set(newMessage.RoomIndex, roomMessages.concat(newMessage));
  } else {
    get(newMessage.RoomIndex, false);
  }
};

export const getLastTimeStamp = (roomIndex: number) => {
  const messages = ChatCache.get(roomIndex);
  if (!messages) return 0;
  const len = messages.length;
  return messages[len - 1].Timestamp ?? 0;
};

export const getNumberNewMessages = (roomIndex: number, lastTimeStamp: number) => {
  const cacheLength = ChatCache.get(roomIndex)?.length ?? 0;
  const lastVisitedPosition =
    ChatCache.get(roomIndex)?.findIndex((message) => message.Timestamp >= lastTimeStamp) ?? 0;
  const numberNewMessages = cacheLength - lastVisitedPosition;
  if (numberNewMessages > 10) return '+10';
  else return numberNewMessages;
};
