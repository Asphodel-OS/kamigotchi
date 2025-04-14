import { EntityID, EntityIndex } from '@mud-classic/recs';
import moment from 'moment';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'app/cache/account';
import { Kami } from 'app/cache/kami';
import { useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import {
  getKamidenClient,
  HarvestEnd,
  Message as KamiMessage,
  Kill,
  Movement,
} from 'clients/kamiden';
import { subscribeToFeed, subscribeToMessages } from 'clients/kamiden/subscriptions';
import { formatEntityID } from 'engine/utils';
import { Room } from 'network/shapes/Room';
import { ActionSystem } from 'network/systems';
import { Message } from './Message';

interface Props {
  activeTab: number;
  setActiveTab: Dispatch<SetStateAction<number>>;
  utils: {
    getAccount: (entityIndex: EntityIndex) => Account;
    getKami: (entityIndex: EntityIndex) => Kami;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getRoomByIndex: (nodeIndex: number) => Room;
  };
  actions: {
    setMessages: (messages: KamiMessage[]) => void;
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
}

const client = getKamidenClient();
export const Feed = (props: Props) => {
  const { utils, player, blocked, actionSystem, api, activeTab, setActiveTab } = props;
  const { getAccount, getEntityIndex, getKami, getRoomByIndex } = props.utils;
  const { modals } = useVisibility();
  const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
  const [feedData, setFeedData] = useState<String[]>([]);
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
      let feedMessage: string[] = [];

      feed.Movements.forEach((movement: Movement) => {
        if (movement.RoomIndex !== player.roomIndex) return;
        if (movement.AccountId === player.id) return;
        let accountName = getAccount(getEntityIndex(formatEntityID(movement.AccountId))).name;
        feedMessage.push(
          `${moment(movement.Timestamp).format('MM/DD HH:mm')} : ${accountName} **entered** the room.`
        );
      });
      feed.HarvestEnds.forEach((harvest: HarvestEnd) => {
        if (harvest.RoomIndex !== player.roomIndex) return;
        let kamiName = getKami(getEntityIndex(formatEntityID(harvest.KamiId))).name;
        feedMessage.push(
          `${moment(harvest.Timestamp).format('MM/DD HH:mm')} : ${kamiName} finished **harvesting**.`
        );
      });
      feed.Kills.forEach((kill: Kill) => {
        let killerName = getKami(getEntityIndex(formatEntityID(kill.KillerId))).name;
        let victimName = getKami(getEntityIndex(formatEntityID(kill.VictimId))).name;
        let roomName = getRoomByIndex(kill.RoomIndex).name;
        let spoil = kill.Spoils;

        feedMessage.push(
          `${moment(kill.Timestamp).format('MM/DD HH:mm')} : ${killerName} **liquidated** ${victimName} in ${roomName} for ${spoil} `
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

  /////////////////
  // HELPERS
  // poll for recent messages. do not update the Feed state/cursor
  async function pollMessages() {
    const response = await client.getRoomMessages({
      RoomIndex: player.roomIndex,
      Timestamp: Date.now(),
    });

    if (response.Messages.length === 0) {
      setNoMoreMessages(true);
      return;
    } else {
      setNoMoreMessages(false);
    }
    setKamidenMessages(response.Messages);
  }

  async function pollMoreMessages() {
    if (noMoreMessages) return;

    setIsPolling(true);
    try {
      const response = await client.getRoomMessages({
        RoomIndex: player.roomIndex,
        Timestamp: kamidenMessages[0].Timestamp,
      });
      if (response.Messages.length === 0) {
        setNoMoreMessages(true);
      } else {
        setKamidenMessages((prev) => [...response.Messages, ...prev]);
      }
    } finally {
      setIsPolling(false);
    }
  }

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
    const { clientHeight, scrollHeight } = node;

    node.scrollTop = scrollHeight;
    setScrollDown(false);
  }, [scrollDown, player.roomIndex, activeTab, modals.chat]);

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
          {feedData?.map((message, index, arr) => {
            let liquidated = message.includes('liquidated');
            let entered = message.includes('entered');
            return (
              <FeedTabMessage
                color={liquidated ? '#ff6161' : entered ? '#eda910' : '#b176f1'}
                key={index}
              >
                &#x2022;
                {message
                  .split('**')
                  .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
                {liquidated ? <Musu src={ItemImages.musu} /> : null}
                {liquidated && `.`}
              </FeedTabMessage>
            );
          })}
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
  line-height: 1.3vw;
  text-align: justify;
  word-break: break-all;
  width: 100%;
`;

const FeedTabMessage = styled.div<{ color: string }>`
  color: black;
  width: 100%;
  font-size: 0.6vw;
  strong {
    font-weight: bold;
    ${({ color }) => `color: ${color} `};
  }
`;

const Musu = styled.img`
  bottom: -0.1vw;
  position: relative;
  width: 0.8vw;
  height: 0.8vw;
`;
