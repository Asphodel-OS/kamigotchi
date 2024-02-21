import { CastWithInteractions, FeedResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'layers/react/components/library';
import { client as neynarClient } from 'src/clients/neynar';

interface Props {}

export const Feed = (props: Props) => {
  const [feed, setFeed] = useState<FeedResponse>();
  const [casts, setCasts] = useState<CastWithInteractions[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // poll for new messages and update the list of current casts
  const poll = async () => {
    setIsPolling(true);
    const newFeed = await neynarClient.fetchFeed('filter', {
      filterType: 'channel_id',
      channelId: 'farcaster',
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
  };

  useEffect(() => {
    poll();
  }, []);

  // TODO update the scroll position accordingly when new casts come in
  useEffect(() => {
    // // scroll component to bottom
    // if (feedRef.current) {
    //   console.log('feedref found on mount');
    //   console.log(`setting scroll to ${feedRef.current.scrollHeight}`);
    //   feedRef.current.scrollTop = feedRef.current.scrollHeight;
    // } else {
    //   console.log('feedref not found on mount');
    // }
  }, [casts]);

  // set poll when scrolling to top
  useEffect(() => {
    const current = feedRef.current;
    const handleScroll = async () => {
      const isNearTop = current && current.scrollTop < 20;
      if (!isPolling && isNearTop) {
        if (feed?.next.cursor) await poll();
      }
    };

    if (current) current.addEventListener('scroll', handleScroll);
    return () => {
      if (current) current.removeEventListener('scroll', handleScroll);
    };
  }, [feed?.next.cursor, isPolling]);

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
              <Time>{moment(cast.timestamp).format('MM/DD HH:mm')}</Time>
            </Header>
            <Body>{cast.text}</Body>
          </Content>
        </Message>
      ))}
    </Wrapper>
  );
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
  padding-bottom: 0.9vw;
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
`;

const Body = styled.div`
  color: black;
  width: 100%;
  font-family: Pixel;
  font-size: 0.8vw;
  line-height: 1.2vw;

  word-wrap: break-word;
`;
