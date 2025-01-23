import { FeedResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useAccount, useVisibility } from 'app/stores';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';
import { getKamidenClient } from 'workers/sync/kamidenStreamClient';
import { Message } from './Message';

interface Props {
  max: number; // max number of casts to disable polling at
  actions: {
    pushMessages: (messages: KamiMessage[]) => void;
    setMessages: (messages: KamiMessage[]) => void;
  };
}

const client = getKamidenClient();
export const Feed = (props: Props) => {
  const { max } = props;
  //const { pushCasts, setCasts } = props.actions;
  const { farcaster } = useAccount();
  const { modals } = useVisibility();

  const [kamidenMessages, setKamidenMessages] = useState<KamiMessage[]>([]);
  const [scrollBottom, setScrollBottom] = useState(0);
  const [feed, setFeed] = useState<FeedResponse>();

  const feedRef = useRef<HTMLDivElement>(null);

  /////////////////
  // SUBSCRIPTION

  // populating the initial feed
  // TODO: set the scroll position to the bottom whenever the modal is reopened
  useEffect(() => {
    console.log('useEffect []');
    pollNew();
  }, []);

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
  // RENDER

  return (
    <Wrapper ref={feedRef}>
      {kamidenMessages
        ?.toReversed()
        .map((message) => <Message key={message.Timestamp} data={{ message }} />)}
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
    const response = await client.getRoomMessages({ RoomIndex: 6 });
    console.log('Messages', response.Messages);
    console.log('feed get messages');
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

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: auto;
`;
