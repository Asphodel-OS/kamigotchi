import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Account } from 'app/cache/account';
import { Kami } from 'app/cache/kami';
import { useVisibility } from 'app/stores';
import { HarvestEnd, Message as KamiMessage, Kill, Movement } from 'engine/types/kamiden/kamiden';
import { formatEntityID } from 'engine/utils';
import { Room } from 'network/shapes/Room';
import { ActionSystem } from 'network/systems';
import {
  getKamidenClient,
  subscribeToFeed,
  subscribeToMessages,
} from 'workers/sync/kamidenStreamClient';
import { Message } from './Message';

interface Props {
  utils: {
    getAccount: (entityIndex: EntityIndex) => Account;
    getKami: (entityIndex: EntityIndex) => Kami;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getRoomByIndex: (nodeIndex: number) => Room;
  };
  actions: {
    pushMessages: (messages: KamiMessage[]) => void;
    setMessages: (messages: KamiMessage[]) => void;
  };
  player: Account;
  blocked: EntityID[];
  actionSystem: ActionSystem;
  api: {
    player: {
      social: {
        friend: { block: (account: string) => void; request: (account: string) => void };
      };
    };
  };
}

const client = getKamidenClient();
export const Feed = (props: Props) => {
  const { utils, player, blocked, actionSystem, api } = props;
  const { getAccount, getEntityIndex, getKami, getRoomByIndex } = props.utils;
  const { modals } = useVisibility();
  const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
  const [feedData, setFeedData] = useState<String[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [scrollDown, setScrollDown] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const [noMoreMessages, setNoMoreMessages] = useState(false);
  //0 Node
  //1 global
  const [activeTab, setActiveTab] = useState(0);
  const [scrollBottom, setScrollBottom] = useState(0);

  /////////////////
  // SUBSCRIPTION

  // Add subscription effects
  useEffect(() => {
    const unsubscribeMessages = subscribeToMessages((message) => {
      if (message.RoomIndex === player.roomIndex) {
        setKamidenMessages((prev) => [message, ...prev]);
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
      feed.Movements.forEach((movement: Movement) => {
        if (movement.RoomIndex !== player.roomIndex) return;
        if (movement.AccountId === player.id) return;
        let accountName = getAccount(getEntityIndex(formatEntityID(movement.AccountId))).name;
        setFeedData((prev) => [`${accountName} entered the room.`, ...prev]);
      });
      feed.HarvestEnds.forEach((harvest: HarvestEnd) => {
        if (harvest.RoomIndex !== player.roomIndex) return;
        let kamiName = getKami(getEntityIndex(formatEntityID(harvest.KamiId))).name;
        setFeedData((prev) => [`${kamiName} finished harvesting.`, ...prev]);
      });
      feed.Kills.forEach((kill: Kill) => {
        let killerName = getKami(getEntityIndex(formatEntityID(kill.KillerId))).name;
        let victimName = getKami(getEntityIndex(formatEntityID(kill.VictimId))).name;
        let roomName = getRoomByIndex(kill.RoomIndex).name;
        let spoil = kill.Spoils;
        setFeedData((prev) => [
          `${killerName} liquidated ${victimName} at ${roomName} for ${spoil} Musu.`,
          ...prev,
        ]);
      });
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
    pollM().finally(() => {
      setIsPolling(false);
    });
  }, [player.roomIndex]);

  /////////////////
  // HELPERS
  // poll for recent messages. do not update the Feed state/cursor
  async function pollM() {
    console.log('pollM polling messages');
    const response = await client.getRoomMessages({
      RoomIndex: player.roomIndex,
      Timestamp: Date.now(),
    });
    console.log('pollM got response', response.Message);
    if (response.Messages.length === 0) {
      setNoMoreMessages(true);
      return;
    } else {
      setNoMoreMessages(false);
    }
    setKamidenMessages(response.Messages.reverse());
  }

  async function pollNew() {
    console.log('pollNew polling messages');
    setIsPolling(true);
    let ts = kamidenMessages[0].Timestamp;
    const response = await client.getRoomMessages({
      RoomIndex: player.roomIndex,
      Timestamp: kamidenMessages[kamidenMessages.length - 1].Timestamp,
    });
    if (response.Messages.length === 0) {
      setNoMoreMessages(true);
      setIsPolling(false);
      return;
    } else {
      setNoMoreMessages(false);
    }
    setKamidenMessages((prev) => [...prev, ...response.Messages.reverse()]);
    setIsPolling(false);
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
        await pollNew();
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
  }, [kamidenMessages.length]);
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
              {kamidenMessages
                ?.toReversed()
                .map(
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
        <div>
          {feedData?.toReversed().map((message, index, arr) => <div>{feedData[index]}</div>)}
        </div>
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
  &:hover {
    cursor: pointer;
  }
  &: disabled {
    background-color: rgb(178, 178, 178);
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
