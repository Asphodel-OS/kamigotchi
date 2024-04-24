import { CastWithInteractions, FeedResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'layers/react/components/library';
import { useAccount } from 'layers/react/store';
import { likeCast, pollChannelCasts, unlikeCast } from 'src/clients/neynar';
import { playClick } from 'utils/sounds';

interface Props {
  max: number; // max number of casts to disable polling at
  casts: CastWithInteractions[];
  setCasts: (casts: CastWithInteractions[]) => void;
}

export const Feed = (props: Props) => {
  const baseUrl = 'https://warpcast.com';
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
  // INTERPRETATION

  // checks whether the cast has been liked by the current user
  const isLiked = (cast: CastWithInteractions) => {
    const fAccount = account.farcaster;
    if (fAccount.id == 0) return false;
    return !!cast.reactions.likes.find((l) => l.fid == fAccount.id);
  };

  /////////////////
  // INTERACTION

  const handleLike = (cast: CastWithInteractions) => {
    playClick();
    if (isLiked(cast)) handleCastUnlike(cast);
    else handleCastLike(cast);
  };

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
      {casts?.toReversed().map((cast) => (
        <Message key={cast.hash}>
          <Pfp
            src={cast.author.pfp_url}
            onClick={() => window.open(`${baseUrl}/${cast.author.username}`)}
          />
          <Content>
            <Header>
              <Author onClick={() => window.open(`${baseUrl}/${cast.author.username}`)}>
                {cast.author.username}
              </Author>
              <Time>
                {moment(cast.timestamp).format('MM/DD HH:mm')}
                <Heart color={isLiked(cast) ? 'red' : 'gray'} onClick={() => handleLike(cast)} />
              </Time>
            </Header>
            <Body onClick={() => window.open(`${baseUrl}/${cast.author.username}/${cast.hash}`)}>
              {cast.text}
            </Body>
          </Content>
        </Message>
      ))}
    </Wrapper>
  );

  /////////////////
  // HELPERS

  // trigger a like of a cast
  async function handleCastLike(cast: CastWithInteractions) {
    const fAccount = account.farcaster;
    if (!fAccount.signer) return;
    const response = await likeCast(fAccount.signer, cast.hash);

    // update the list of casts
    if (response.success) {
      cast.reactions.likes.push({ fid: fAccount.id });
      for (const [i, cast] of casts.entries()) {
        if (casts.find((c) => c.hash === cast.hash)) {
          casts[i] = cast;
          break;
        }
      }
      setCasts(casts);
    }
  }

  // trigger an unlike of a cast
  async function handleCastUnlike(cast: CastWithInteractions) {
    const fAccount = account.farcaster;
    if (!fAccount.signer) return;
    const response = await unlikeCast(fAccount.signer, cast.hash);

    // update the list of casts
    if (response.success) {
      const index = cast.reactions.likes.findIndex((l) => l.fid == fAccount.id);
      if (index > -1) cast.reactions.likes.splice(index, 1);
      for (const [i, cast] of casts.entries()) {
        if (casts.find((c) => c.hash === cast.hash)) {
          casts[i] = cast;
          break;
        }
      }
      setCasts(casts);
    }
  }

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

const Message = styled.div`
  padding: 0.9vw 0.9vw;
  width: 100%;

  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  gap: 0.4vw;
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

  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }
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

  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }
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

  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }
`;

const Heart = styled.div<{ color: string }>`
  width: 1.2vw;
  background:
    radial-gradient(circle at 60% 65%, ${(props) => props.color} 64%, transparent 65%) top left,
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

  &::hover {
    cursor: pointer;
  }
`;
