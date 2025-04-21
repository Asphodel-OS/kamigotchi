import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getChatLastTimeStamp, getChatNumberNewMessages } from 'app/cache/chat';
import { Modals, useSelected, useVisibility } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

const chatOpened = new Map<number, number>();
const nodeVisited = new Map<number, number>();
export const ChatMenuButton = () => {
  const { modals } = useVisibility();
  const modalsToHide: Partial<Modals> = {
    bridgeERC20: false,
    bridgeERC721: false,
    dialogue: false,
    emaBoard: false,
    help: false,
    inventory: false,
    leaderboard: false,
    nameKami: false,
    quests: false,
    settings: false,
    presale: false,
    trading: false,
  };

  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [notification, setNotification] = useState(false);

  const { roomIndex } = useSelected();

  // ticking
  useEffect(() => {
    const timerId = setInterval(() => {
      setLastRefresh(Date.now());
    }, 250);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    nodeVisited.set(roomIndex, Date.now());
  }, [roomIndex]);

  useEffect(() => {
    if (modals.chat) {
      chatOpened.set(roomIndex, Date.now());
      setNotification(false);
    } else {
      // if chat has been opened before
      if (chatOpened.has(roomIndex)) {
        if (chatOpened.get(roomIndex)! < getChatLastTimeStamp(roomIndex)) {
          setNotification(true);
        } else {
          setNotification(false);
        }
      } else {
        // if room has been visited but chat hast been opened yet
        if (nodeVisited.has(roomIndex)) {
          if (nodeVisited.get(roomIndex)! < getChatLastTimeStamp(roomIndex)) {
            setNotification(true);
          } else {
            setNotification(false);
          }
        }
      }
    }
  }, [lastRefresh, roomIndex, modals.chat]);

  return (
    <Container>
      <MenuButton
        id='chat-button'
        image={ChatIcon}
        tooltip='Chat'
        targetModal='chat'
        hideModals={modalsToHide}
      />
      <Status notification={notification}>
        <Number>
          {getChatNumberNewMessages(
            roomIndex,
            chatOpened.get(roomIndex) ?? nodeVisited.get(roomIndex) ?? 0
          )}
        </Number>
      </Status>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
`;

const Status = styled.div<{ notification: boolean }>`
  display: ${({ notification }) => (notification ? 'block' : 'none')};
  border: solid 0.1vw white;
  position: absolute;
  bottom: 0.9%;
  right: 0%;

  height: fit-content;
  padding: 0.2vw;
  border-radius: 33vw;
  z-index: 1;
  background-color: green;
`;

const Number = styled.text`
  color: white;
  font-size: 0.8vh;
`;
