import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { CastWithInteractions, FeedResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import moment from 'moment';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ActionButton } from '../../library';

interface Props {
  client: NeynarAPIClient;
}

export const Feed = (props: Props) => {
  const { client } = props;
  const [feed, setFeed] = useState<FeedResponse>();
  const [casts, setCasts] = useState<CastWithInteractions[]>([]);

  const poll = async () => {
    const newFeed = await client.fetchFeed('filter', {
      filterType: 'channel_id',
      channelId: 'kamigotchi',
      cursor: feed?.next.cursor || undefined,
      limit: 2,
    });
    setFeed(newFeed);

    const currCasts = casts;
    for (const cast of newFeed.casts) {
      if (!currCasts.find((c) => c.hash === cast.hash)) {
        currCasts.push(cast);
      }
    }
    setCasts(currCasts);
  };

  useEffect(() => {
    poll();
  }, []);

  useEffect(() => {
    console.log('feed', feed);
  }, [feed]);

  useEffect(() => {
    console.log('casts', casts);
  }, [casts]);

  return (
    <Wrapper>
      <ActionButton text='load more' id='load' onClick={poll} />
      {casts?.toReversed().map((cast) => (
        <Message2>
          <Pfp src={cast.author.pfp_url} />

          <Message>
            <Header>
              <Author>{cast.author.username}</Author>
              <Time>{moment(cast.timestamp).format('YYYY-MM-DD HH:mm')}</Time>
            </Header>
            <Content>{cast.text}</Content>
          </Message>
        </Message2>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 0.5vw;
  align-self: center;
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: scroll;

  font-family: Pixel;
`;

const Message2 = styled.div`
  padding: 0.9vw 0.6vw;
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

const Message = styled.div`
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
  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.4vw;
`;

const Author = styled.div`
  color: orange;
  font-size: 1.2vw;
`;

const Time = styled.div`
  color: black;
  font-size: 1vw;
`;

const Content = styled.div`
  color: black;
  font-size: 0.9vw;
  line-height: 1.2vw;
`;
