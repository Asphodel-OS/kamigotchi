import { EntityIndex } from '@mud-classic/recs';
import CakeIcon from '@mui/icons-material/Cake';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import TollIcon from '@mui/icons-material/Toll';
import moment from 'moment';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Popover, Tooltip } from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

interface Props {
  isLoading: boolean;
  handlePfpChange: (kami: Kami) => void;
  account: Account; // account selected for viewing
  isSelf: boolean;

  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
  };
}

export const Bio = (props: Props) => {
  const { isLoading, account, utils, isSelf, handlePfpChange } = props;
  const { getAccountKamis } = utils;

  const [lastRefresh, setLastRefresh] = useState(Date.now());

  /////////////////
  // TRACKING

  // ticking
  useEffect(() => {
    const refreshClock = () => {
      setLastRefresh(Date.now());
    };
    const timerId = setInterval(refreshClock, 3333);
    return function cleanup() {
      clearInterval(timerId);
    };
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

  const AddressDisplay = () => {
    if (!account.ownerAddress) return null;
    const address = account.ownerAddress;
    const addrPrefix = address.slice(0, 6);
    const addrSuffix = address.slice(-4);
    return (
      <Tooltip text={[address]}>
        <Subtitle onClick={() => copyText(address)}>
          {addrPrefix}...{addrSuffix}
        </Subtitle>
      </Tooltip>
    );
  };

  const BirthdayRow = () => {
    if (!account.time.creation) return null;
    return (
      <DetailRow>
        <CakeIcon style={{ height: '1.4vw', width: '1.4vw' }} />
        <Description>{moment(1000 * account.time.creation).format('MMM DD, YYYY')}</Description>
      </DetailRow>
    );
  };

  const KillsRow = () => {
    return (
      <DetailRow>
        <CheckroomIcon style={{ height: '1.4vw', width: '1.4vw' }} />
        <Description>{account.stats?.kills ?? 0} Lives Claimed</Description>
      </DetailRow>
    );
  };

  const CoinRow = () => {
    return (
      <DetailRow>
        <TollIcon style={{ height: '1.4vw', width: '1.4vw' }} />
        <Description>{account.stats?.coin ?? 0} MUSU Collected</Description>
      </DetailRow>
    );
  };

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
        <PfpImage isLoading={isLoading} draggable='false' src={account.pfpURI} />
        <Tooltip text={[getLastSeenString()]}>
          <PfpStatus isLoading={isLoading} timeDelta={lastRefresh / 1000 - account.time.last} />
        </Tooltip>
      </PfpContainer>
    );
  };

  return (
    <Container key={account.name}>
      <Content>
        <Identifiers>
          <TitleRow>
            <Title>{account.name}</Title>
          </TitleRow>
          <AddressDisplay />
        </Identifiers>
        <BirthdayRow />
        <KillsRow />
        <CoinRow />
      </Content>
      {isSelf ? (
        <Popover cursor={`url(${ActionIcons.edit}), auto`} key='profile' content={KamisDropDown()}>
          {Pfp()}
        </Popover>
      ) : (
        Pfp()
      )}
    </Container>
  );
};

const Container = styled.div`
  color: black;
  padding: 1.2vw;
  display: flex;
  flex-flow: row nowrap;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 0.5vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const Identifiers = styled.div`
  padding-bottom: 0.6vw;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
`;

const TitleRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  gap: 0.5vw;
`;

const Title = styled.div`
  padding-top: 0.15vw;
  font-family: Pixel;
  font-size: 1.1vw;
`;

const Subtitle = styled.div`
  color: #777;
  padding: 0.5vw;
  flex-grow: 1;

  font-family: Pixel;
  font-size: 0.7vw;

  cursor: copy;
`;

const DetailRow = styled.div`
  padding: 0.3vw 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3vw;
`;

const Description = styled.div`
  font-size: 0.7vw;
  font-family: Pixel;
  line-height: 0.9vw;
  text-align: left;
  padding-top: 0.2vw;
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
