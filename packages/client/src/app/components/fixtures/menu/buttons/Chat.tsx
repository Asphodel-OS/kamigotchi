import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Modals, useSelected, useVisibility } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/menu';
import { Message as KamiMessage, subscribeToMessages } from 'clients/kamiden';
import { MenuButton } from './MenuButton';

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
  const [newMessage, setNewMassage] = useState(false);
  const [messagesLength, setMessagesLength] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
  const { roomIndex } = useSelected();

  // ticking
  useEffect(() => {
    const timerId = setInterval(() => {
      setLastRefresh(Date.now());
    }, 250);
    return () => clearInterval(timerId);
  }, []);

  // hides status when changing rooms
  useEffect(() => {
    setNewMassage(false);
  }, [roomIndex]);

  // registers new messages
  useEffect(() => {
    if (!modals.chat) {
      subscribeToMessages((message) => {
        if (message.RoomIndex === roomIndex) {
          setKamidenMessages((prev) => [...prev, message]);
        }
      });
    } else setNewMassage(false);
  }, [lastRefresh]);

  // if new messages are added we show the notification
  useEffect(() => {
    if (kamidenMessages.length > messagesLength) {
      setNewMassage(true);
      setMessagesLength(kamidenMessages.length);
    }
  }, [kamidenMessages]);

  return (
    <Container>
      <MenuButton
        id='chat-button'
        image={ChatIcon}
        tooltip='Chat'
        targetModal='chat'
        hideModals={modalsToHide}
      />
      <Status newMessage={newMessage} />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
`;

const Status = styled.div<{ newMessage: boolean }>`
  display: ${({ newMessage }) => (newMessage ? 'block' : 'none')};
  border: solid 0.1vw white;
  position: absolute;
  bottom: 0.9%;
  right: 0%;
  width: 32%;
  height: 32%;
  border-radius: 33vw;
  z-index: 1;
  background-color: green;
`;
