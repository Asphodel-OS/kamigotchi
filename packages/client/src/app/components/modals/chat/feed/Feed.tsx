import { EntityID, EntityIndex } from 'engine/recs';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'app/cache/account';
import { pushBattles } from 'app/cache/battles';
import { getChat, pushChat } from 'app/cache/chat';
import { Item } from 'app/cache/item';
import { Kami } from 'app/cache/kami';
import { Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import {
  KamiCast as CastEvent,
  getKamidenClient,
  HarvestEnd as HarvestEndEvent,
  Message as KamiMessage,
  Kill as KillEvent,
  Movement as MovementEvent,
} from 'clients/kamiden';
import { subscribeToFeed, subscribeToMessages } from 'clients/kamiden/subscriptions';
import { rooms } from 'constants/rooms';
import { formatEntityID } from 'engine/utils';
import { BigNumber } from 'ethers';
import { Room } from 'network/shapes/Room';
import { ActionSystem } from 'network/systems';
import { playClick } from 'utils/sounds';
import { getDateString } from 'utils/time';
import { Message } from './Message';

// TODO: retrieve this in the flow of the application with hooks
const KamidenClient = getKamidenClient();

export const Feed = ({
  activeTab,
  setActiveTab,
  utils,
  player,
  blocked,
  actionSystem,
  api,
}: {
  activeTab: number;
  setActiveTab: Dispatch<SetStateAction<number>>;
  utils: {
    getAccount: (entityIndex: EntityIndex) => Account;
    getKami: (entityIndex: EntityIndex) => Kami;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getRoomByIndex: (nodeIndex: number) => Room;
    getItemByIndex: (itemIndex: number) => Item;
  };
  player: Account;
  blocked: EntityID[];
  actionSystem: ActionSystem;
  api: {
    player: {
      account: {
        friend: { block: (account: string) => void; request: (account: string) => void };
      };
    };
  };
}) => {
  const { getAccount, getEntityIndex, getKami, getRoomByIndex, getItemByIndex } = utils;
  const selectAccount = useSelected((s) => s.setAccount);
  const selectedAccount = useSelected((s) => s.accountIndex);
  const selectKami = useSelected((s) => s.setKami);
  const selectedKami = useSelected((s) => s.kamiIndex);
  const selectNode = useSelected((s) => s.setNode);
  const selectedNode = useSelected((s) => s.nodeIndex);
  const setModals = useVisibility((s) => s.setModals);
  const accountModalVisible = useVisibility((s) => s.modals.account);
  const chatModalVisible = useVisibility((s) => s.modals.chat);
  const kamiModalVisible = useVisibility((s) => s.modals.kami);
  const nodeModalVisible = useVisibility((s) => s.modals.node);

  const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
  const [feedData, setFeedData] = useState<React.ReactNode[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [scrollDown, setScrollDown] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const [noMoreMessages, setNoMoreMessages] = useState(false);

  const [scrollBottom, setScrollBottom] = useState(0);

  /////////////////
  // SUBSCRIPTION

  // Add subscription effects
  useEffect(() => {
    const unsubscribeMessages = subscribeToMessages((message) => {
      if (message.RoomIndex === player.roomIndex) {
        setKamidenMessages((prev) => [...prev, message]);
      }
      pushChat(message);
      if (player.id === message.AccountId) {
        setScrollDown(!scrollDown);
      } else {
        var element = document.getElementById('feed');
        if (element) {
          const isBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 1;
          if (isBottom) {
            setScrollDown(!scrollDown);
          }
        }
      }
    });

    const unsubscribeFeed = subscribeToFeed((feed) => {
      let feedMessage: React.ReactNode[] = [];

      // process Movement events
      feed.Movements.forEach((movement: MovementEvent) => {
        if (movement.RoomIndex !== player.roomIndex) return;
        const room = getRoomByIndex(movement.RoomIndex);
        const account = getAccount(getEntityIndex(formatEntityID(movement.AccountId)));
        const accountName = movement.AccountId === player.id ? 'You' : account.name;

        feedMessage.push(
          <Row>
            <Bold color='#333'>{getDateString(movement.Timestamp, 3)}:</Bold>
            <Text size={0.6} onClick={() => openAccountModal(account)}>
              {accountName}
            </Text>
            <Bold color='#eda910'> entered</Bold>
            <TextTooltip text={[room.name]}>
              <RoomIcon src={getRoomImage(room)} onClick={() => openNodeModal(room)} />
            </TextTooltip>
          </Row>
        );
      });

      // process Harvest Stop events
      feed.HarvestEnds.forEach((harvest: HarvestEndEvent) => {
        if (harvest.RoomIndex !== player.roomIndex) return;
        const kami = getKami(getEntityIndex(formatEntityID(harvest.KamiId)));
        const room = getRoomByIndex(harvest.RoomIndex);

        feedMessage.push(
          <Row>
            <Bold color='#333'>{getDateString(harvest.Timestamp, 3)}:</Bold>
            <TextTooltip text={[kami.name]}>
              <KamiIcon src={kami.image} onClick={() => openKamiModal(kami)} />
            </TextTooltip>
            <Bold color='#b176f1'>stopped</Bold>
            harvesting in
            <TextTooltip text={[room.name]}>
              <RoomIcon src={getRoomImage(room)} onClick={() => openNodeModal(room)} />
            </TextTooltip>
          </Row>
        );
      });

      // process Harvest Liquidate events
      feed.Kills.forEach((kill: KillEvent) => {
        pushBattles(kill);
        const killer = getKami(getEntityIndex(formatEntityID(BigNumber.from(kill.KillerId))));
        const victim = getKami(getEntityIndex(formatEntityID(BigNumber.from(kill.VictimId))));
        const room = getRoomByIndex(kill.RoomIndex);

        feedMessage.push(
          <Row>
            <Bold color='#333'>{getDateString(kill.Timestamp, 0)}:</Bold>
            <TextTooltip text={[killer.name]}>
              <KamiIcon src={killer.image} onClick={() => openKamiModal(killer)} />
            </TextTooltip>
            <Bold color='#ff6161'>liquidated</Bold>
            <TextTooltip text={[victim.name]}>
              <KamiIcon src={victim.image} onClick={() => openKamiModal(victim)} />
            </TextTooltip>
            for {kill.Spoils}
            <TextTooltip text={['Musu']}>
              <Icon src={ItemImages.musu} />
            </TextTooltip>
            in
            <TextTooltip text={[room.name]}>
              <RoomIcon src={getRoomImage(room)} onClick={() => openNodeModal(room)} />
            </TextTooltip>
          </Row>
        );
      });

      // process Item Cast events
      feed.KamiCasts.forEach((cast: CastEvent) => {
        const caster = getAccount(getEntityIndex(formatEntityID(BigNumber.from(cast.AccountID))));
        const victim = getKami(getEntityIndex(formatEntityID(BigNumber.from(cast.TargetID))));
        const item = getItemByIndex(cast.itemIndex);
        const room = getRoomByIndex(cast.nodeIndex);

        feedMessage.push(
          <Row>
            <Bold color='#333'>{getDateString(cast.Timestamp, 0)}:</Bold>
            {caster.name}
            <Bold color='#33a58fff'> used </Bold>
            <TextTooltip text={[item?.name]}>
              <Icon src={item?.image} />
            </TextTooltip>
            on
            <TextTooltip text={[victim.name]}>
              <KamiIcon src={victim.image} onClick={() => openKamiModal(victim)} />
            </TextTooltip>
            in
            <TextTooltip text={[room.name]}>
              <RoomIcon src={getRoomImage(room)} onClick={() => openNodeModal(room)} />
            </TextTooltip>
          </Row>
        );
      });

      if (feedData.length >= 50) {
        setFeedData((prev) => [...prev.slice(prev.length - 50, prev.length), ...feedMessage]);
      } else {
        setFeedData((prev) => [...prev, ...feedMessage]);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeFeed();
    };
  }, [player.roomIndex]);

  // Initial message poll effect (keep existing one)
  useEffect(() => {
    setKamidenMessages([]);
    setIsPolling(true);
    pollMessages().finally(() => {
      setIsPolling(false);
    });
  }, [player.roomIndex]);

  // scrolling effects
  // when scrolling, autopoll when nearing the top and set the scroll position
  // as distance from the bottom to ensure feed visualization stays consistent
  useEffect(() => {
    if (!feedRef.current) return;
    const node = feedRef.current;
    const handleScroll = async () => {
      const isNearTop = node.scrollTop < 20;
      //  if (!isPolling && isNearTop && feed?.next.cursor) await pollNew();
      if (!isPolling && isNearTop) {
        setIsPolling(true);
        await pollMoreMessages();
      }
      const { scrollTop, scrollHeight, clientHeight } = node;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      setScrollBottom(scrollBottom);
    };

    node.addEventListener('scroll', handleScroll);
    return () => node.removeEventListener('scroll', handleScroll);
    // [feed?.next.cursor, isPolling, casts]
  }, [isPolling, kamidenMessages]);

  // As new casts come in, set scroll position to bottom
  // if already there. Otherwise hold the line.
  useEffect(() => {
    if (!feedRef.current) return;
    const node = feedRef.current;
    const { clientHeight, scrollHeight } = node;

    if (scrollBottom < 5) node.scrollTop = scrollHeight;
    else if (node.scrollTop === 0) {
      node.scrollTop = scrollHeight - scrollBottom - clientHeight;
    }
  }, [kamidenMessages.length, feedData.length]);
  /*   
    when the player sends a message it scrolls to thebottom  
  */
  useEffect(() => {
    if (!feedRef.current) return;
    const node = feedRef.current;
    const { scrollHeight } = node;

    node.scrollTop = scrollHeight;
    setScrollDown(false);
  }, [scrollDown, player.roomIndex, activeTab, chatModalVisible]);

  /////////////////
  // INTERPRETATION

  // get the image of a room object
  const getRoomImage = (room: Room) => {
    const roomObject = rooms[room.index] ?? rooms[0];
    return roomObject.backgrounds[0];
  };

  /////////////////
  // INTERACTION

  // open the Account Modal with the selected account shown
  const openAccountModal = (account: Account) => {
    const isAccountSelected = selectedAccount === account.index;

    if (accountModalVisible) {
      if (isAccountSelected) setModals({ account: false });
      else selectAccount(account.index);
    } else {
      if (!isAccountSelected) selectAccount(account.index);
      setModals({ account: true, map: false, party: false });
    }

    playClick();
  };

  // open the Kami Modal with the selected kami shown
  const openKamiModal = (kami: Kami) => {
    const isKamiSelected = selectedKami === kami.index;

    if (kamiModalVisible) {
      if (isKamiSelected) setModals({ kami: false });
      else selectKami(kami.index);
    } else {
      if (!isKamiSelected) selectKami(kami.index);
      setModals({ kami: true });
    }

    playClick();
  };

  // open the Node Modal to the selected Node
  const openNodeModal = (room: Room) => {
    const isRoomSelected = selectedNode === room.index;

    if (nodeModalVisible) {
      if (isRoomSelected) setModals({ node: false });
      else selectNode(room.index);
    } else {
      if (!isRoomSelected) selectNode(room.index);
      setModals({ node: true });
    }

    playClick();
  };

  // poll for recent messages. do not update the Feed state/cursor
  const pollMessages = async () => {
    const messages = await getChat(player.roomIndex, false);
    if (messages.length === kamidenMessages.length) {
      setNoMoreMessages(true);
      return;
    } else {
      setNoMoreMessages(false);
    }
    setKamidenMessages(messages);
  };

  const pollMoreMessages = async () => {
    if (!KamidenClient || noMoreMessages) return;

    setIsPolling(true);
    try {
      const messages = await getChat(player.roomIndex, true);
      if (messages.length === kamidenMessages.length) {
        setNoMoreMessages(true);
      } else {
        setKamidenMessages(messages);
      }
    } finally {
      setIsPolling(false);
    }
  };

  /////////////////
  // RENDER

  return (
    <Wrapper ref={feedRef} id='feed'>
      <Buttons>
        <Button
          position={0}
          disabled={activeTab === 0}
          onClick={() => {
            setActiveTab(0);
          }}
        >
          {`Room`}
        </Button>
        <Button
          position={6.3}
          disabled={activeTab === 1}
          onClick={() => {
            setActiveTab(1);
          }}
        >
          {`Feed`}
        </Button>
      </Buttons>
      {activeTab === 0 ? (
        <Messages>
          {noMoreMessages === false && kamidenMessages.length !== 0 ? (
            <PollingMessage>Polling chat messages...</PollingMessage>
          ) : (
            noMoreMessages === true &&
            kamidenMessages.length !== 0 && (
              <PollingMessage>No more chat messages...</PollingMessage>
            )
          )}
          <>
            <div>
              {kamidenMessages?.map(
                (message, index, arr) =>
                  !blocked.includes(
                    getAccount(getEntityIndex(formatEntityID(message.AccountId))).id
                  ) && (
                    <Message
                      previousEqual={
                        index !== 0 ? arr[index - 1].AccountId === message.AccountId : false
                      }
                      player={player}
                      utils={utils}
                      key={index}
                      data={{ message }}
                      api={api}
                      actionSystem={actionSystem}
                    />
                  )
              )}
            </div>
          </>
          {kamidenMessages.length === 0 && (
            <PollingMessage>No messages in this room</PollingMessage>
          )}
        </Messages>
      ) : (
        <FeedTab>
          {feedData.map((message, index) => (
            <FeedTabMessage key={index}>{message}</FeedTabMessage>
          ))}
        </FeedTab>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  margin-top: 1.5vw;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 0.6vw;
`;

const Buttons = styled.div`
  top: 0;
  left: 0;
  position: absolute;
  width: 100%;
`;

const Messages = styled.div`
  width: 100%;
`;

// disabled { z-index: 2;
//hover {  cursor: pointer;
const Button = styled.button<{ position: number }>`
  position: absolute;
  ${({ position }) => position && `left:${position}vw;`};
  font-size: 1vw;
  padding: 0.4vw;
  padding-right: 2vw;
  padding-left: 2vw;
  border-radius: 0 0 0.8vw 0.8vw;
  border-top: 0;
  z-index: 1;
  background-color: #c5c5c5;
  &:hover {
    cursor: pointer;
  }
  &: disabled {
    background-color: rgb(255, 255, 255);
    z-index: 2;
    border-color: black;
    cursor: default;
  }
`;

const PollingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
`;

const FeedTab = styled.div`
  line-height: 1.8vw;
  text-align: justify;
  word-break: break-all;
  width: 100%;
`;

const FeedTabMessage = styled.div`
  display: block;
  gap: 0.3vw;
  color: black;
  width: 100%;
  font-size: 0.6vw;
`;

const Row = styled.span`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 0.3vw;
`;

const Bold = styled.span<{ color: string }>`
  font-weight: bold;
  color: ${({ color }) => color};
`;

const Icon = styled.img`
  position: relative;
  width: 0.9vw;
  height: 0.9vw;
`;

const KamiIcon = styled.img`
  position: relative;
  border-radius: 0.3vw;
  width: 1.5vw;
  height: 1.5vw;

  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`;

const RoomIcon = styled.img`
  position: relative;
  border-radius: 0.3vw;
  width: 1.5vw;
  height: 1.5vw;

  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`;
