import { Feed, Message } from './proto';

type FeedCallback = (feed: Feed) => void;
type MessageCallback = (message: Message) => void;

export const FeedCallbacks: FeedCallback[] = [];
export const MessageCallbacks: MessageCallback[] = [];

export function subscribeToMessages(callback: MessageCallback) {
  MessageCallbacks.push(callback);
  const cleanup = () => {
    const index = MessageCallbacks.indexOf(callback);
    if (index > -1) MessageCallbacks.splice(index, 1);
  };
  return cleanup;
}

export function subscribeToFeed(callback: FeedCallback) {
  FeedCallbacks.push(callback);
  const cleanup = () => {
    const index = FeedCallbacks.indexOf(callback);
    if (index > -1) FeedCallbacks.splice(index, 1);
  };
  return cleanup;
}
