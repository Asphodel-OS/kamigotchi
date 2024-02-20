import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { CastWithInteractions, FeedResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from '../../library';

interface Props {
  client: NeynarAPIClient;
}

export const Feed = (props: Props) => {
  const { client } = props;
  const [feed, setFeed] = useState<FeedResponse>();
  const [casts, setCasts] = useState<CastWithInteractions[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    const newFeed = await client.fetchFeed('filter', {
      filterType: 'channel_id',
      channelId: 'kamigotchi',
      cursor: feed?.next.cursor ?? '',
      limit: 5,
    });
    setFeed(newFeed);

    const currCasts = [...casts];
    for (const cast of newFeed.casts) {
      if (!currCasts.find((c) => c.hash === cast.hash)) currCasts.push(cast);
    }
    setCasts(currCasts);
  }, [client, feed]);

  useEffect(() => {
    poll();
    // const current = feedRef.current;
    // const handleScroll = (oldCasts: CastWithInteractions[]) => {
    //   if (feedRef.current && feedRef.current.scrollTop === 0) {
    //     console.log('scrolltop: ', feedRef.current.scrollTop);
    //     poll();
    //   }
    // };
    //
    // if (current) current.addEventListener('scroll', () => handleScroll(casts));
    // return () => {
    //   if (current) current.removeEventListener('scroll', () => handleScroll(casts));
    // };
  }, []);

  useEffect(() => {
    console.log('feed casts', feed?.casts);
    console.log('feed cursor', feed?.next.cursor);
  }, [feed]);

  useEffect(() => {
    console.log('casts', casts);
  }, [casts]);

  return (
    <Wrapper ref={feedRef}>
      <Tooltip text={feed?.next.cursor ? ['load more'] : ['no more!']}>
        <ActionButton text='load more' id='load' onClick={poll} disabled={!feed?.next.cursor} />
      </Tooltip>
      {casts?.toReversed().map((cast) => (
        <Message>
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
  }
`;

const Content = styled.div`
  color: black;
  width: 100%;
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
`;
