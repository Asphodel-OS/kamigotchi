import { getKamidenClient, Message } from 'clients/kamiden';

// nodeindex ,messages list
export const ChatCache = new Map<number, Message[]>();
const KamidenClient = getKamidenClient();

export const get = async (roomIndex: number, append: boolean) => {
  if (!ChatCache.has(roomIndex) || append) await process(roomIndex, append);
  return ChatCache.get(roomIndex)!;
};

// !append (user hasnt scrolled yet)
// append(user has scrolled, older messages neeed to be loaded)
export const process = async (roomIndex: number, append: boolean) => {
  if (!KamidenClient) {
    console.warn('process(): Kamiden client not initialized');
    console.log('NO KAMIDEN');
    ChatCache.set(roomIndex, []);
    return;
  }
  var msgs = ChatCache.get(roomIndex);
  console.log(`process(): ${roomIndex}`);
  console.log(`messages: ${msgs?.length}`);
  console.log(`messages[0]: ${msgs?.[0]?.Timestamp}`);
  if (msgs) {
    for (var i = 0; i < msgs.length; i++) {
      console.log(`messages[${i}]: ${ChatCache.get(roomIndex)?.[i]?.Timestamp}`);
    }
  }

  const messages: Message[] = ChatCache.get(roomIndex) ?? [];
  const lastTs = messages[0]?.Timestamp ?? Date.now();
  const response = await KamidenClient.getRoomMessages({
    RoomIndex: roomIndex,
    Timestamp: lastTs,
  });
  console.log(`requesting ${lastTs} ts`);
  console.log(`response.Messages.length: ${response.Messages.length}`);
  console.log('_________________________________________________________');
  ChatCache.set(roomIndex, response.Messages.concat(messages));

  // if (!append) {
  // // Previous Implementation
  //   const response = await KamidenClient.getRoomMessages({
  //     RoomIndex: roomIndex,
  //     Timestamp: Date.now(),
  //   });

  //   ChatCache.set(roomIndex, response.Messages);
  // } else {
  //   const loadedMessages = ChatCache.get(roomIndex);
  //   const response = await KamidenClient.getRoomMessages({
  //     RoomIndex: roomIndex,
  //     Timestamp: loadedMessages?.[0]?.Timestamp,
  //   });
  //   ChatCache.set(roomIndex, response.Messages.concat(loadedMessages!));
  // }
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
