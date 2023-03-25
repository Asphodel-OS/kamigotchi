import React, { useState, useEffect, useCallback } from 'react';
import { map, merge } from 'rxjs';
import {
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';
import { registerUIComponent } from '../engine/store';
import styled from 'styled-components';
import './font.css';
import clickSound from '../../../public/sound/sound_effects/mouseclick.wav';
import { ModalWrapper } from './styled/AnimModalWrapper';

import * as mqtt from 'mqtt';
import { useModalVisibility } from 'layers/react/hooks/useHandleModalVisibilty';

const mqttServerUrl = 'wss://chatserver.asphodel.io:8083/mqtt';
const mqttTopic = 'kamigotchi';

export function registerChat() {
  registerUIComponent(
    'Chat',
    {
      colStart: 65,
      colEnd: 100,
      rowStart: 2,
      rowEnd: 40,
    },

    (layers) => {
      const {
        network: {
          world,
          network,
          components: { IsAccount, AccountID, OperatorAddress, Name },
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

      const relay: mqtt.MqttClient = mqtt.connect(mqttServerUrl);

      useEffect(() => {
        const botElement = document.getElementById('botElement');

        const sub = relay.subscribe(mqttTopic, function (err: any) {
          if (!err) {
            postMessage('<['.concat(chatName, '] came online>'));
          }
        });

        const update_mqtt = () => {
          relay.on('message', function (topic: any, rawMessage: any) {
            const message = rawMessage.toString();
            setMessages((messages) => [
              ...messages,
              { seenAt: Date.now(), message },
            ]);
          });
          botElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'start',
          });
        };
        update_mqtt();

        return () => {
          postMessage('<['.concat(chatName, '] went offline>'));
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
        if (event.keyCode === 13) {
          postMessage(chatInput);
        }
        if (event.keyCode === 27) {
        }
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChatInput(event.target.value);
      };

      const messageLines = messages.map((message) => (
        <li
          style={{ fontFamily: 'Pixel', fontSize: '12px' }}
          key={message.seenAt}
        >
          {`${message.message}`}
        </li>
      ));

      const { handleClick, visibleDiv } = useModalVisibility({
        soundUrl: clickSound,
        divName: 'chat',
        elementId: 'chat_modal',
      });

      return (
        <ModalWrapper id="chat_modal" isOpen={visibleDiv}>
          <ModalContent>
            <TopButton onClick={handleClick}>X</TopButton>
            <ChatWrapper>
              <ChatBox style={{ pointerEvents: 'auto' }}>
                {messageLines}
                <div id="botElement"> </div>
              </ChatBox>
              <ChatInput
                style={{ pointerEvents: 'auto' }}
                type="text"
                onKeyDown={(e) => catchKeys(e)}
                value={chatInput}
                onChange={(e) => handleChange(e)}
              />
            </ChatWrapper>
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const ChatWrapper = styled.div`
  background-color: #ffffff;
  color: black;
  padding: 5px 12px;
  text-align: left;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  font-family: Pixel;
  margin: 0px;
`;

const ChatBox = styled.div`
  height: 200px;
  width: 100%;
  overflow: scroll;
  white-space: normal;
  word-wrap: break-word;
  padding: 10px 12px 25px 12px;
  cursor: pointer;
`;

const ChatInput = styled.input`
  width: 100%;
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const ModalContent = styled.div`
  display: grid;
  background-color: white;
  border-radius: 10px;
  padding: 8px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  font-family: Pixel;

  &:active {
    background-color: #c2c2c2;
  }
`;

const Description = styled.p`
  font-size: 16px;
  color: #333;
  text-align: left;
  padding: 20px;
  font-family: Pixel;
`;

const TypeHeading = styled.p`
  font-size: 20px;
  color: #333;
  font-family: Pixel;
  grid-column: 1;
  justify-self: left;
  align-self: middle;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c2c2c2;
  }
  justify-self: right;
`;

const TopGrid = styled.div`
  display: grid;
  margin: 2px;
`;
