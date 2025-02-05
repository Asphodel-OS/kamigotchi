import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Account } from 'app/cache/account';
import { useVisibility } from 'app/stores';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';
import { formatEntityID } from 'engine/utils';
import { ActionSystem } from 'network/systems';
import { getKamidenClient, subscribeToMessages } from 'workers/sync/kamidenStreamClient';
import { Message } from './Message';

interface Props {
  utils: {
    getAccount: (entityIndex: EntityIndex) => Account;
    getEntityIndex: (entity: EntityID) => EntityIndex;
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
  const { getAccount, getEntityIndex } = props.utils;
  const { modals } = useVisibility();
  const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
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

  // Add subscription effect
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message) => {
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

    return () => {
      unsubscribe();
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
    setKamidenMessages(response.Messages.reverse());
  }

  async function pollNew() {
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
          disabled={false}
          /*disabled={activeTab === 0}
          onClick={() => {
            setActiveTab(0);
          }}*/
        >
          {`Room`}
        </Button>
        <Button
          position={6.3}
          disabled={true}
          /* disabled={activeTab === 1}
          onClick={() => {
            setActiveTab(1);
          }}*/
        >
          {`Global`}
        </Button>
      </Buttons>
      {activeTab === 0 && (
        <Messages>
          {noMoreMessages === false && kamidenMessages.length !== 0 ? (
            <PollingMessage>Polling chat messages...</PollingMessage>
          ) : (
            noMoreMessages === true &&
            kamidenMessages.length !== 0 && (
              <PollingMessage>No more chat messages...</PollingMessage>
            )
          )}
          {
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
          }
          {kamidenMessages.length === 0 && (
            <PollingMessage>No messages in this room</PollingMessage>
          )}
        </Messages>
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
    cursor: auto;
  }
  &: disabled {
    background-color: rgb(178, 178, 178);
    z-index: 0;
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
