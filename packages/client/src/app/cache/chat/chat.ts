import { getKamidenClient, Message } from 'clients/kamiden';

// nodeindex ,messages list
export const ChatCache = new Map<number, Message[]>();
const KamidenClient = getKamidenClient();

export const get = async (roomIndex: number, append: boolean) => {
  if (!ChatCache.has(roomIndex) || append) await process(roomIndex);
  return ChatCache.get(roomIndex)!;
};

export const process = async (roomIndex: number) => {
  if (!KamidenClient) {
    console.warn('process(): Kamiden client not initialized');
    ChatCache.set(roomIndex, []);
    return;
  }
  const messages: Message[] = ChatCache.get(roomIndex) ?? [];
  const lastTs = messages[0]?.Timestamp ?? Date.now();
  const response = await KamidenClient.getRoomMessages({
    RoomIndex: roomIndex,
    Timestamp: lastTs,
  });
  ChatCache.set(roomIndex, response.Messages.concat(messages));
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

export const getLastTimestamp = (roomIndex: number) => {
  const messages = ChatCache.get(roomIndex);
  if (!messages) return 0;
  const len = messages.length;
  return messages[len - 1]?.Timestamp ?? 0;
};

export const numMessagesSince = (roomIndex: number, lastTimeStamp: number) => {
  const cacheLength = ChatCache.get(roomIndex)?.length ?? 0;
  const lastVisitedPosition =
    ChatCache.get(roomIndex)?.findIndex((message) => message.Timestamp >= lastTimeStamp) ?? 0;
  const numberNewMessages = cacheLength - lastVisitedPosition;
  return numberNewMessages;
};
