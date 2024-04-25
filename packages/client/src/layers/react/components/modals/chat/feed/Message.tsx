import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import moment from 'moment';
import styled from 'styled-components';

import { Account } from 'layers/react/store';
import { likeCast, unlikeCast } from 'src/clients/neynar';
import { playClick } from 'utils/sounds';

interface Props {
  data: {
    account: Account;
    cast: CastWithInteractions;
    casts: CastWithInteractions[];
  };
  actions: {
    setCasts: (casts: CastWithInteractions[]) => void;
  };
}

export const Message = (props: Props) => {
  const baseUrl = 'https://warpcast.com';
  const { account, cast, casts } = props.data;
  const { setCasts } = props.actions;

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

  return (
    <Container>
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
    </Container>
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
};

const Container = styled.div`
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
