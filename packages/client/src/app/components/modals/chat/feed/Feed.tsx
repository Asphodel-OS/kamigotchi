import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { EntityID } from '@mud-classic/recs';
import { Account } from 'app/cache/account';
import { useVisibility } from 'app/stores';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';
import { formatEntityID } from 'engine/utils';
import { ActionSystem } from 'network/systems';
import { getKamidenClient, subscribeToMessages } from 'workers/sync/kamidenStreamClient';
import { Message } from './Message';

interface Props {
  nodeIndex: number;
  utils: {
    getAccountByID: (accountid: EntityID) => Account;
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
  const { nodeIndex, utils, player, blocked, actionSystem, api } = props;
  const { getAccountByID } = props.utils;
  const { modals } = useVisibility();
  const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [scrollDown, setScrollDown] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  //0 Node
  //1 global
  const [activeTab, setActiveTab] = useState(0);

  /////////////////
  // SUBSCRIPTION

  // Add subscription effect
  useEffect(() => {
    console.log('[kamiden] registering message callback for room', nodeIndex);

    const unsubscribe = subscribeToMessages((message) => {
      if (message.RoomIndex === nodeIndex) {
        setKamidenMessages((prev) => [message, ...prev]);
      }

      if (player.id === message.AccountId) {
        setScrollDown(true);
      } else {
        var element = document.getElementById('feed');
        if (element) {
          const isBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 1;
          if (isBottom) {
            setScrollDown(true);
          }
        }
      }
    });

    return () => {
      console.log('[kamiden] cleaning up message callback for room', nodeIndex);
      unsubscribe();
    };
  }, [nodeIndex]);

  // Initial message poll effect (keep existing one)
  useEffect(() => {
    console.log('useEffect []');
    setKamidenMessages([]);
    setIsPolling(true);
    poll().finally(() => {
      setIsPolling(false);
    });
  }, [nodeIndex]);

  /////////////////
  // SCROLLER
  const scroller = () => {
    var element = document.getElementById('feed');
    if (element) {
      element.scrollTop = element.scrollHeight;
    } // when user has scrolled down to the bottom of feed and keeps writing  the scroll automatically goes to the new bottom
    if (element && element.scrollTop === element.scrollHeight - element.offsetHeight) {
      element.scrollTop = element.scrollHeight;
    }
    setScrollDown(false);
  };

  useEffect(() => {
    scroller();
  }, [activeTab, isPolling, modals.chat, nodeIndex]);

  useEffect(() => {
    if (scrollDown === true) {
      scroller();
    }
  }, [scrollDown]);
  /////////////////
  // RENDER
  ///detect if user has reached  top of feed
  const handleScroll = (e: any) => {
    const top = e.target.scrollTop === 0;
    if (top) {
      console.log(`reached top`);
    }
  };

  return (
    <Wrapper ref={feedRef} id='feed' onScroll={handleScroll}>
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
          {`Global`}
        </Button>
      </Buttons>
      {activeTab === 0 && (
        <Messages>
          {isPolling ? (
            <PollingMessage>Polling chat messages...</PollingMessage>
          ) : kamidenMessages.length === 0 ? (
            <PollingMessage>No messages in this room</PollingMessage>
          ) : (
            kamidenMessages
              ?.toReversed()
              .map(
                (message, index, arr) =>
                  !blocked.includes(getAccountByID(formatEntityID(message.AccountId)).id) && (
                    <Message
                      previousEqual={
                        index !== 0 ? arr[index - 1].AccountId === message.AccountId : false
                      }
                      player={player}
                      utils={utils}
                      key={(message.Timestamp, message.AccountId)}
                      data={{ message }}
                      api={api}
                      actionSystem={actionSystem}
                    />
                  )
              )
          )}
        </Messages>
      )}
    </Wrapper>
  );

  /////////////////
  // HELPERS

  // poll for recent messages. do not update the Feed state/cursor
  async function poll() {
    console.log('in poll function');
    const response = await client.getRoomMessages({ RoomIndex: nodeIndex });
    setKamidenMessages(response.Messages.reverse());
  }
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
