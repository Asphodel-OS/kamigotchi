import React, { useState, useEffect, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import {
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';
import Urbit from '@urbit/http-api';

import { Message, Update, SendMessagePayload } from "../../utils/uqChat/types"

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';

const chatId = "0x8155.2625.a7c4.bda2.9baf.2ec7.0cbf.297d";

export function registerChatModal() {
  registerUIComponent(
    'Chat',
    {
      colStart: 69,
      colEnd: 100,
      rowStart: 10,
      rowEnd: 62,
    },

    (layers) => {
      const {
        network: {
          world,
          network,
          components: { IsAccount, OperatorAddress, Name },
        },
        phaser: {
          game: {
            scene: {
              keys: { Main },
            },
          },
        },
      } = layers;

      const getName = (index: EntityIndex) => {
        return getComponentValue(Name, index)?.value as string;
      };

      return merge(IsAccount.update$, Name.update$).pipe(
        map(() => {
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];
          const chatName = getName(accountIndex);
          return {
            chatName: chatName,
          };
        })
      );
    },

    ({ chatName }) => {
      const [api] = useState<Urbit>(new Urbit(""));

      const [messages, setMessages] = useState<Message[]>([]);
      const [chatInput, setChatInput] = useState('');

      useEffect(() => {
        Urbit.authenticate({
          ship: 'ritsyd-foprel',
          url: 'https://ritsyd-foprel.urbox.one',
          code: 'divtyp-namreb-magtyv-ronfed',
        });
      }, []);

      // UQ
      useEffect(() => {
        if (api) {
          const subPromise = api.subscribe({
            app: 'pongo',
            path: '/updates',
            event: handleMessage,
            err: () => console.warn('SUBSCRIPTION ERROR'),
            quit: () => {
              console.log("chat: subscription clogged");
              throw new Error('subscription clogged');
            }
          })

          return () => {
            subPromise.then(sub => api.unsubscribe(sub))
          }
        }
      }, [api]);

      const handleMessage = (update: Update) => {
        if ('message' in update && update.message.conversation_id === chatId) {
          setMessages([...messages, update.message.message]);
          scrollToBottom();
        } else if ('sending' in update && update.sending.conversation_id === chatId) {
          const existing = messages.find(m => String(m.id) === update.sending.identifier)
          if (existing) {
            existing.status = 'sent'
            existing.identifier = String(existing.id)
          }
        } else if ('delivered' in update && update.delivered.conversation_id === chatId) {
          const existing = messages.find(m => m.identifier === update.delivered.identifier)
          if (existing) {
            if (update.delivered.message_id) {
              existing.id = update.delivered.message_id
            }
            existing.status = 'delivered'
          }
        } else if ('invite' in update && update.invite.id === chatId) {
          // this gives the chat of a new invite, not sure how you'd handle it
        }
      }

      const sendMessage = useCallback(async ({ convo, kind, content, identifier = `-${Date.now()}`, reference, mentions }: SendMessagePayload) => {
        // Where convo is the conversation (chat) ID, kind is usually 'text', content is the message content
        // identifier is a unique identifier for the message prior to it being confirmed (allows for 'sent' receipts)
        // reference is the ID of the message being replied to (if any)
        // mentions is optional and is an array of all the @-mentions in the message by ship name like ['~fabnev-hinmur', '~hocwyn-tipwex']
        console.log("sending message");
        await api.poke({ app: 'pongo', mark: 'pongo-action', json: { 'send-message': { convo, kind, content, identifier, reference, mentions } } })
      }, [api])

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          sendMessage({ convo: chatId, kind: 'text', content: chatInput, mentions: [] });
        }
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChatInput(event.target.value);
      };

      const messageLines = messages.map((message) => (
        <li
          style={{ fontFamily: 'Pixel', fontSize: '12px', listStyleType: 'none' }}
          key={message.timestamp}
        >
          {`${message.content}`}
        </li>
      ));

      const scrollToBottom = () => {
        const botElement = document.getElementById('botElement');
        botElement?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'start',
        });
      };

      //////////////////////////
      // Chat gating

      // array of blocked domains
      const hasURL = (string: string) => {
        const blockedDomains = [".com", ".co", ".xyz", ".net", ".io", ".org"];
        // checks if string is a url
        let has = false;
        for (let i = 0; i < blockedDomains.length; i++) {
          if (string.includes(blockedDomains[i])) {
            has = true;
          }
        }
        return has;
      }

      return (
        <ModalWrapperFull divName="chat" id="chat_modal">
          <ChatWrapper>
            <ChatFeed style={{ pointerEvents: 'auto' }}>
              {messageLines}
              <div id="botElement"> </div>
            </ChatFeed>
            <ChatInput
              style={{ pointerEvents: 'auto' }}
              type="text"
              onKeyDown={(e) => catchKeys(e)}
              value={chatInput}
              onChange={(e) => handleChange(e)}
            />
          </ChatWrapper>
        </ModalWrapperFull>
      );
    }
  );
}

const ChatWrapper = styled.div`
  height: 100%;
  background-color: #ffffff;
  color: black;
  text-align: left;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  font-family: Pixel;
  margin: 0px;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: stretch;
`;

const ChatFeed = styled.div`
  overflow: scroll;
  padding: 10px 12px 25px 12px;
  
  flex-grow: 1;
  color: black;
  font-family: Pixel;
  word-wrap: break-word;
  white-space: normal;
  cursor: pointer;
`;

const ChatInput = styled.input`
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  padding: 15px 12px;
  margin: 15px 0px;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);

  color: black;
  font-family: Pixel;
  font-size: 12px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
`;
