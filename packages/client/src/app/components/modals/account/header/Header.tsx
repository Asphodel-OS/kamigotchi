import { EntityIndex } from '@mud-classic/recs';
import CakeIcon from '@mui/icons-material/Cake';
import moment from 'moment';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Overlay, Popover, Text, TextTooltip } from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import { KAMI_BASE_URI } from 'constants/media';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Friends as FriendsType } from 'network/shapes/Account/friends';
import { Friendship } from 'network/shapes/Friendship';
import { Kami } from 'network/shapes/Kami';
import { Account as PlayerAccount } from 'app/stores';
import { abbreviateAddress } from 'utils/address';
import { playClick } from 'utils/sounds';
import { Bio } from './Bio';
import { Friend as FriendActions } from './Friend';

interface Props {
  account: Account; // account selected for viewing
  actions: {
    setBio: (bio: string) => void;
    handlePfpChange: (kami: Kami) => void;
    requestFren: (account: BaseAccount) => void;
    cancelFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
    acceptFren: (friendship: Friendship) => void;
  };
  isLoading: boolean;
  isSelf: boolean;
  player: PlayerAccount;
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
    getFriends: (accEntity: EntityIndex) => FriendsType;
  };
}

export const Header = (props: Props) => {
  const { isLoading, account, utils, isSelf, actions, player } = props;
  const { getAccountKamis, getFriends } = utils;
  const { handlePfpChange, setBio, requestFren, cancelFren, blockFren, acceptFren } = actions;

  const [tick, setTick] = useState(Date.now());

  /////////////////
  // TRACKING

  // ticking
  useEffect(() => {
    const refreshClock = () => setTick(Date.now());
    const timerId = setInterval(refreshClock, 3333);
    return () => clearInterval(timerId);
  }, []);

  const copyText = (text: string) => {
    playClick();
    navigator.clipboard.writeText(text);
  };

  /////////////////
  // INTERPRETATION

  const getLastSeenString = () => {
    return `Last Seen: ${moment(1000 * account.time.last).fromNow()}`;
  };

  /////////////////
  // RENDERING

  const KamisDropDown = () => {
    let kamis = getAccountKamis(account.entity).map((kami) => (
      <KamiDropDown
        disabled={account.pfpURI === kami.image}
        key={kami.id}
        onClick={() => {
          handlePfpChange(kami);
        }}
      >
        {kami.name}
      </KamiDropDown>
    ));
    if (kamis.length === 0) {
      kamis = [<div style={{ padding: `0.5vw` }}>No Kamis</div>];
    }
    return kamis;
  };

  const Pfp = () => {
    return (
      <PfpContainer>
        <PfpImage
          isLoading={isLoading}
          draggable='false'
          src={`${KAMI_BASE_URI + account.pfpURI}.gif`}
        />
        <TextTooltip text={[getLastSeenString()]}>
          <PfpStatus isLoading={isLoading} timeDelta={tick / 1000 - account.time.last} />
        </TextTooltip>
      </PfpContainer>
    );
  };

  const Friend = () => {
    return (
        <FriendActions
          account={account}
          player={player}
          utils={{ getFriends }}
          actions={{ requestFren, acceptFren, cancelFren, blockFren }}
        />
    );
  };

  return (
    <Container>
      <Overlay top={0.75} right={0.75}>
        <Text size={0.6}>#{account.index}</Text>
      </Overlay>
      {isSelf ? (
        <Popover cursor={`url(${ActionIcons.edit}), auto`} key='profile' content={KamisDropDown()}>
          {Pfp()}
        </Popover>
      ) : (
        Pfp()
      )}
      <Info>
        <TitleSection>
          <Text size={1.2}>{account.name}</Text>
          <TextTooltip title='Owner Address' text={[account.ownerAddress, '\n', '(click to copy)']}>
            <Subtitle onClick={() => copyText(account.ownerAddress)}>
              {abbreviateAddress(account.ownerAddress)}
            </Subtitle>
          </TextTooltip>
        </TitleSection>
        {!isSelf && (
          Friend()
        )}
        <DetailRow>
          <CakeIcon style={{ height: '1.4vh' }} />
          <Description>{moment(1000 * account.time.creation).format('MMM DD, YYYY')}</Description>
        </DetailRow>
        <Bio account={account} isSelf={isSelf} actions={{ setBio }} />
      </Info>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.75vw;
  display: flex;
  flex-flow: row nowrap;
  gap: 0.9vw;
  align-items: flex-start;
  user-select: none;
`;

const PfpContainer = styled.div`
  position: relative;
  width: 10vw;
  height: 10vw;
`;

const PfpImage = styled.img<{ isLoading: boolean }>`
  border: solid black 0.15vw;
  border-radius: 10vw;
  width: 10vw;
  height: 10vw;
  object-fit: cover;
  object-position: 100% 0;
  opacity: 1;
  ${({ isLoading }) =>
    isLoading &&
    `animation: fade 3s linear infinite;
    z-index: 1;
    @keyframes fade {
      0%,
      100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }`}
`;

const PfpStatus = styled.div<{ timeDelta: number; isLoading: boolean }>`
  border: solid 0.2vw white;
  position: absolute;
  bottom: 0.9vw;
  right: 0.9vw;
  width: 1.2vw;
  height: 1.2vw;
  border-radius: 3vw;
  z-index: 1;
  background-color: ${(props) => {
    if (props.timeDelta < 300) return '#6f3';
    else if (props.timeDelta < 1800) return '#fd3';
    else return '#f33';
  }};
  ${({ isLoading }) =>
    isLoading &&
    `animation: fade 3s linear infinite;
    z-index: 1;
    @keyframes fade {
      0%,
      100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }`}
`;

const Info = styled.div`
  width: 100%;
  padding-bottom: 1.5vw;
  gap: 0.3vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
`;

const TitleSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 0.3vw;
  margin-bottom: 0.6vw;
`;

const Subtitle = styled.div`
  color: #777;
  padding-left: 0.5vw;
  font-size: 0.7vw;
  cursor: copy;
`;

const DetailRow = styled.div<{ edit?: boolean }>`
  padding: 0.15vw 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  ${({ edit }) => edit && `cursor: pointer`}
`;

const Description = styled.div`
  font-size: 0.7vw;
  line-height: 0.9vw;
`;

const KamiDropDown = styled.button`
  padding: 0.5vw;
  display: flex;
  flex-direction: column;
  width: 100%;
  &:hover {
    cursor: pointer;
  }
  &:disabled {
    cursor: auto;
    background-color: #ccc;
    color: #666;
  }
`;
