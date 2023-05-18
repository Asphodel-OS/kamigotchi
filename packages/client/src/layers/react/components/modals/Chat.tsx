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
import * as mqtt from 'mqtt';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';


const mqttServerUrl = 'wss://chatserver.asphodel.io:8083/mqtt';
const mqttTopic = 'kamigotchi';

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
      type ChatMessage = { seenAt: number; message: string };

      const [messages, setMessages] = useState<ChatMessage[]>([]);
      const [chatInput, setChatInput] = useState('');

      const options = {
        connectTimeout: 300000,
        reconnectPeriod: 10000,
      }

      const relay: mqtt.MqttClient = mqtt.connect(mqttServerUrl, options);

      useEffect(() => {
        const botElement = document.getElementById('botElement');

        const sub = relay.subscribe(mqttTopic, function (err: any) {
          if (!err && chatName) {
            postMessage('<['.concat(chatName, '] came online>'));
          }
        });

        const update_mqtt = () => {
          relay.on('message', function (topic: any, rawMessage: any) {
            const message = rawMessage.toString();
            if (!hasURL(message)) {
              setMessages((messages) => [
                ...messages,
                { seenAt: Date.now(), message },
              ]);
            }
          });
          botElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'start',
          });
        };
        update_mqtt();

        return () => {
          if (chatName) postMessage('<['.concat(chatName, '] went offline>'));
          sub.unsubscribe(mqttTopic, function (err: any) { });
        };
      }, [chatName]);

      const postMessage = useCallback(
        async (input: string) => {
          const botElement = document.getElementById('botElement');
          const message = `[${chatName}]: ${input}`;
          relay.publish(mqttTopic, message);
          setChatInput('');
          botElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'start',
          });
        },
        [chatName]
      );

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          postMessage(chatInput);
        }
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChatInput(event.target.value);
      };

      const messageLines = messages.map((message) => (
        <li
          style={{ fontFamily: 'Pixel', fontSize: '12px', listStyleType: 'none' }}
          key={message.seenAt}
        >
          {`${message.message}`}
        </li>
      ));

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
