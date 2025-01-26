import { FeedResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { EntityID } from '@mud-classic/recs';
import { Account } from 'app/cache/account';
import { useAccount, useVisibility } from 'app/stores';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';
import { getKamidenClient } from 'workers/sync/kamidenStreamClient';
import { Message } from './Message';

interface Props {
  scrollDown: boolean;
  max: number; // max number of casts to disable polling at
  nodeIndex: number;
  utils: {
    getAccountByID: (accountid: EntityID) => Account;
  };
  actions: {
    pushMessages: (messages: KamiMessage[]) => void;
    setMessages: (messages: KamiMessage[]) => void;
    setScrollDown: (scrollDown: boolean) => void;
  };
}

const client = getKamidenClient();
export const Feed = (props: Props) => {
  const { max, nodeIndex, utils, scrollDown } = props;
  const { setScrollDown } = props.actions;

  //const { pushCasts, setCasts } = props.actions;
  const { farcaster } = useAccount();
  const { modals } = useVisibility();

  const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
  const [scrollBottom, setScrollBottom] = useState(0);
  const [feed, setFeed] = useState<FeedResponse>();

  const feedRef = useRef<HTMLDivElement>(null);

  //0 Node
  //1 global
  const [activeTab, setActiveTab] = useState(0);

  /////////////////
  // SUBSCRIPTION

  // populating the initial feed
  // TODO: set the scroll position to the bottom whenever the modal is reopened
  useEffect(() => {
    console.log('useEffect []');
    pollNew();
  }, [nodeIndex]);

  // time-based autopolling of new messages (10s atm)
  // TODO: autoexpand and contract this polling based on detected activity
  useEffect(() => {
    console.log('[modals.chat, kamidenMessages]');
    const pollTimerId = setInterval(pollNew, 10000);
    return function cleanup() {
      clearInterval(pollTimerId);
    };
  }, [modals.chat, kamidenMessages]);

  // scrolling effects
  // when scrolling, autopoll when nearing the top and set the scroll position
  // as distance from the bottom to ensure feed visualization stays consistent
  useEffect(() => {
    if (!feedRef.current) return;
    const node = feedRef.current;

    const handleScroll = async () => {
      const isNearTop = node.scrollTop < 20;
      const { scrollTop, scrollHeight, clientHeight } = node;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      setScrollBottom(scrollBottom);
    };

    node.addEventListener('scroll', handleScroll);
    return () => node.removeEventListener('scroll', handleScroll);
  }, [feed?.next.cursor, kamidenMessages]);

  // As new casts come in, set scroll position to bottom
  // if already there. Otherwise hold the line.
  useEffect(() => {
    if (!feedRef.current) return;
    const node = feedRef.current;
    const { clientHeight, scrollHeight } = node;

    if (scrollBottom < 5) node.scrollTop = scrollHeight;
    else node.scrollTop = scrollHeight - scrollBottom - clientHeight;
  }, [kamidenMessages.length]);

  /////////////////
  // SCROLLER
  const scroller = () => {
    var element = document.getElementById('feed');
    if (element) element.scrollTop = element.scrollHeight;
    setScrollDown(false);
  };
  useEffect(() => {
    scroller();
  }, [scrollDown, activeTab, nodeIndex, modals.chat]);

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
          {`Room ${nodeIndex}`}
        </Button>
        <Button
          position={8.3}
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
          {kamidenMessages
            ?.toReversed()
            .map((message) => <Message utils={utils} key={message.Timestamp} data={{ message }} />)}
        </Messages>
      )}
    </Wrapper>
  );

  /////////////////
  // HELPERS

  // poll for the next feed of messages and update the list of current casts
  async function pollMore() {
    console.log('feed poll more');
  }

  // poll for recent messages. do not update the Feed state/cursor
  async function pollNew() {
    console.log('feed polling new');
    const response = await client.getRoomMessages({ RoomIndex: nodeIndex });
    console.log('Messages', response.Messages);
    for (const message of response.Messages) {
      console.log('message', message.Timestamp);
    }
    setKamidenMessages(response.Messages.reverse());
    /*
    if (modals.chat) {
      const newFeed = await pollChannelCasts('kamigotchi', '', 5);
      pushCasts(newFeed.casts);
    }
    */
  }
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: auto;
`;

const Buttons = styled.div`
  top: 0;
  left: 0;
  position: absolute;
  width: 100%;
`;

const Messages = styled.div`
  width: 100%;
  margin-top: 1vh;
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
  &:hover {
    cursor: pointer;
  }
  &: disabled {
    background-color: rgb(178, 178, 178);
    z-index: 1;
    border-color: black;
    cursor: default;
  }
`;
