import { CastWithInteractions, FeedResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'layers/react/components/library';
import { client as neynarClient } from 'src/clients/neynar';

interface Props {
  max: number; // max number of casts to disable polling at
  casts: CastWithInteractions[];
  setCasts: (casts: CastWithInteractions[]) => void;
}

export const Feed = (props: Props) => {
  const { max, casts, setCasts } = props;
  const [scrollBottom, setScrollBottom] = useState(0);
  const [feed, setFeed] = useState<FeedResponse>();
  const [isPolling, setIsPolling] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    poll();
  }, []);

  // scrolling effects
  useEffect(() => {
    const node = feedRef.current;
    const handleScroll = async () => {
      // start polling when scrolling to top
      const isNearTop = node && node.scrollTop < 20;
      if (!isPolling && isNearTop && feed?.next.cursor) await poll();

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
          id='load'
          onClick={poll}
          disabled={!feed?.next.cursor || isPolling}
        />
      </Tooltip>
      {casts?.toReversed().map((cast) => (
        <Message
          key={cast.hash}
          onClick={() => window.open(`https://warpcast.com/${cast.author.username}/${cast.hash}`)}
        >
          <Pfp src={cast.author.pfp_url} />
          <Content>
            <Header>
              <Author>{cast.author.username}</Author>
              <Time>
                {moment(cast.timestamp).format('MM/DD HH:mm')}
                <Heart color='red' />
              </Time>
            </Header>
            <Body>{cast.text}</Body>
          </Content>
        </Message>
      ))}
    </Wrapper>
  );

  /////////////////
  // HELPERS

  // poll for new messages and update the list of current casts
  async function poll() {
    if (casts.length > max) return;
    if (casts.length > 0 && feed?.next.cursor === '') return;

    setIsPolling(true);
    const newFeed = await neynarClient.fetchFeed('filter', {
      filterType: 'channel_id',
      channelId: 'kamigotchi',
      cursor: feed?.next.cursor ?? '',
      limit: 10, // defaults to 25, max 100
    });
    setFeed(newFeed);

    const currCasts = [...casts];
    for (const cast of newFeed.casts) {
      if (!currCasts.find((c) => c.hash === cast.hash)) currCasts.push(cast);
    }
    setCasts(currCasts);
    setIsPolling(false);
  }
};

const Wrapper = styled.div`
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;
`;

const Message = styled.div`
  padding: 0.9vw 0.9vw;
  width: 100%;

  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  gap: 0.4vw;

  &:hover {
    background-color: #f5f5f5;
    cursor: pointer;
  }
`;

const Content = styled.div`
  width: 85%;
  color: black;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Pfp = styled.img`
  margin-right: 0.4vw;
  width: 3.6vw;
  height: 3.6vw;
  border-radius: 50%;
`;

const Header = styled.div`
  padding-bottom: 0.6vw;
  width: 100%;
  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.4vw;
`;

const Author = styled.div`
  color: orange;
  font-family: Pixel;
  font-size: 1vw;
`;

const Time = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.4vw;
`;

const Body = styled.div`
  color: black;
  width: 100%;
  font-family: Pixel;
  font-size: 0.8vw;
  line-height: 1.2vw;

  word-wrap: break-word;
`;

const Heart = styled.div<{ color: string }>`
  width: 1.2vw;
  background: radial-gradient(circle at 60% 65%, ${(props) => props.color} 64%, transparent 65%) top
      left,
    radial-gradient(circle at 40% 65%, ${(props) => props.color} 64%, transparent 65%) top right,
    linear-gradient(to bottom left, ${(props) => props.color} 43%, transparent 43%) bottom left,
    linear-gradient(to bottom right, ${(props) => props.color} 43%, transparent 43%) bottom right;
  background-size: 50% 50%;
  background-repeat: no-repeat;
  display: inline-block;
  cursor: pointer;

  margin-bottom: 0.1vw;
  &::before {
    content: '';
    padding-left: 0.3vw;
    padding-top: 100%;
    display: block;
  }
`;
