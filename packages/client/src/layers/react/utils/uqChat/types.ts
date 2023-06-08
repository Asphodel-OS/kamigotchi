export interface Reactions {
  [emoji: string]: string[];
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed'

export interface Message {
  conversation_id?: string
  id: string;
  author: string;
  identifier?: string;
  timestamp: number;
  kind: MessageKind;
  content: string;
  reactions: Reactions;
  edited: boolean;
  reference: string | null;
  status?: MessageStatus;
}

export interface Chat {
  conversation: {
    id: string;
    name: string;
    members: string[];
    leaders: string[];
    last_active: number; // hoon timestamp
    last_read: string;
    muted: boolean;
    dm: boolean;
    deleted: boolean;
    'org-id'?: string;
  }
  messages: Message[];
  last_message: Message | null;
  unreads: number;
}

export interface Chats {
  [chatId: string]: Chat
}

export type MessageKind = 'text'
  | 'image'
  | 'link'
  | 'app-link'
  | 'poll'
  | 'code'
  | 'reply'
  | 'member-add'
  | 'member-remove'
  | 'change-name'
  | 'leader-add'
  | 'leader-remove'
  | 'change-router'
  | 'send-tokens'
  | 'webrtc-call'
  | 'pass-through'

export interface ConversationsUpdate {
  conversations: Chat[]
}

export interface MessageListUpdate {
  message_list: Message[]
}

export interface InviteUpdate {
  invite: {
    name: string;
    last_read: string;
    last_active: number;
    id: string;
    members: string[];
    leaders: string[];
    muted: boolean;
    dm: boolean;
  }
}

export interface SendingUpdate {
  sending: {
    conversation_id: string;
    identifier: string;
  }
}

export interface DeliveredUpdate {
  delivered: {
    conversation_id: string;
    message_id: string;
    identifier: string;
  }
}

export interface SearchUpdate {
  search_result: {
    conversation_id: string;
    message: Message;
  }[]
}

export interface MessageUpdate {
  message: {
    conversation_id: string;
    message: Message;
  }
}

export type Update = ConversationsUpdate
  | MessageListUpdate
  | InviteUpdate
  | SendingUpdate
  | DeliveredUpdate
  | SearchUpdate
  | MessageUpdate

export interface SendMessagePayload {
  convo: string;
  kind: string;
  content: string;
  identifier?: string;
  reference?: string;
  mentions: string[];
}