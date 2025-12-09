import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getChatLastTimestamp } from 'app/cache/chat';
import { Modals, useSelected, useVisibility } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/menu';
import { subscribeToMessages } from 'clients/kamiden/subscriptions';
import { MenuButton } from './MenuButton';

const LastClearTs = new Map<number, number>(); // roomIndex => ts last opened
const ModalsToHide: Partial<Modals> = {
  help: false,
  inventory: false,
  quests: false,
  settings: false,
  questDialogue: false,
  dialogue: false,
};

export const ChatMenuButton = () => {
  const chatModalOpen = useVisibility((s) => s.modals.chat);
  const roomIndex = useSelected((s) => s.roomIndex);
  const [notification, setNotification] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const displayCount = () => (newMessageCount > 10 ? '+10' : newMessageCount);

  // subscribe to new messages of current room
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message) => {
      if (message.RoomIndex === roomIndex && !chatModalOpen) {
        setNotification(true);
        setNewMessageCount((prev) => prev + 1);
      }
    });
    return unsubscribe;
  }, [roomIndex, chatModalOpen]);

  useEffect(() => {
    if (chatModalOpen) {
      setNotification(false);
      setNewMessageCount(0);
      LastClearTs.set(roomIndex, Date.now());
    } else {
      const lastChatTs = getChatLastTimestamp(roomIndex);
      const lastClearTs = LastClearTs.get(roomIndex) ?? 0;
      setNotification(lastChatTs > lastClearTs);
      setNewMessageCount(0);
    }
  }, [chatModalOpen, roomIndex]);

  useEffect(() => {
    if (!LastClearTs.has(roomIndex)) {
      LastClearTs.set(roomIndex, Date.now());
      setNewMessageCount(0);
    }
  }, [roomIndex]);

  return (
    <Container>
      <MenuButton
        id='chat-button'
        image={ChatIcon}
        tooltip='Chat'
        targetModal='chat'
        hideModals={ModalsToHide}
      />
      <Status notification={notification && newMessageCount > 0}>
        <Number>{displayCount()}</Number>
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

const Number = styled.p`
  color: white;
  font-size: 0.8vh;
`;
