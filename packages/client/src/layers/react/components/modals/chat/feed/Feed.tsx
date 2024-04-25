import { CastWithInteractions, FeedResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'layers/react/components/library';
import { useAccount } from 'layers/react/store';
import { pollChannelCasts } from 'src/clients/neynar';
import { Message } from './Message';

interface Props {
  max: number; // max number of casts to disable polling at
  casts: CastWithInteractions[];
  setCasts: (casts: CastWithInteractions[]) => void;
}

export const Feed = (props: Props) => {
  const { max, casts, setCasts } = props;
  const { account } = useAccount();

  const [scrollBottom, setScrollBottom] = useState(0);
  const [feed, setFeed] = useState<FeedResponse>();
  const [isPolling, setIsPolling] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  /////////////////
  // SUBSCRIPTION

  useEffect(() => {
    pollMore();
  }, []);

  // scrolling effects
  useEffect(() => {
    const node = feedRef.current;
    const handleScroll = async () => {
      // start polling when scrolling to top
      const isNearTop = node && node.scrollTop < 20;
      if (!isPolling && isNearTop && feed?.next.cursor) await pollMore();

      // set the new scroll position as distance from bottom
      if (node) {
        const { scrollTop, scrollHeight, clientHeight } = node;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        setScrollBottom(scrollBottom);
      }
    };

    if (node) node.addEventListener('scroll', handleScroll);
    return () => {
      if (node) node.removeEventListener('scroll', handleScroll);
    };
  }, [feed?.next.cursor, isPolling]);

  // update the scroll position accordingly when new casts come in
  useEffect(() => {
    if (!feedRef.current) return;
    const node = feedRef.current;
    const { clientHeight, scrollHeight } = node;

    // set scroll position to bottom if already there, otherwise ensure position is maintained
    if (scrollBottom < 5) node.scrollTop = scrollHeight;
    else node.scrollTop = scrollHeight - scrollBottom - clientHeight;
  }, [casts.length]);

  /////////////////
  // RENDER

  return (
    <Wrapper ref={feedRef}>
      <Tooltip text={feed?.next.cursor ? ['load more'] : ['no more!']}>
        <ActionButton
          text={isPolling ? 'polling..' : 'load more'}
          onClick={pollMore}
          disabled={!feed?.next.cursor || isPolling}
        />
      </Tooltip>
      {casts
        ?.toReversed()
        .map((cast) => (
          <Message key={cast.hash} data={{ account, cast, casts }} actions={{ setCasts }} />
        ))}
    </Wrapper>
  );

  /////////////////
  // HELPERS

  // poll for the next feed of messages and update the list of current casts
  async function pollMore() {
    if (casts.length > max) return;
    if (casts.length > 0 && feed?.next.cursor === '') return;

    setIsPolling(true);

    const cursor = feed?.next.cursor ?? '';
    const newFeed = await pollChannelCasts('kamigotchi', cursor);
    setFeed(newFeed);

    // adds new casts to the current list, with preference for new data, and sorts the list
    const currCasts = [...casts];
    for (const [i, cast] of newFeed.casts.entries()) {
      if (currCasts.find((c) => c.hash === cast.hash)) currCasts[i] = cast;
      else currCasts.push(cast);
    }
    currCasts.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
    setCasts(currCasts);
    setIsPolling(false);
  }

  // poll for new messages from the feed and update the list of current casts. do not update the Feed state
  async function pollNew() {
    const cursor = feed?.next.cursor ?? '';
    const newFeed = await pollChannelCasts('kamigotchi', cursor, 5);

    // adds new casts to the current list, with preference for new data, and sorts the list
    const currCasts = [...casts];
    for (const [i, cast] of newFeed.casts.entries()) {
      if (currCasts.find((c) => c.hash === cast.hash)) {
        currCasts[i] = cast;
      } else {
        currCasts.push(cast);
      }
    }
    currCasts.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
    setCasts(currCasts);
  }
};

const Wrapper = styled.div`
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;
`;
