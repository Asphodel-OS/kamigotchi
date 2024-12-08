import CakeIcon from '@mui/icons-material/Cake';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import TollIcon from '@mui/icons-material/Toll';
import moment from 'moment';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { FarcasterConnect, Tooltip } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { ActionSystem } from 'network/systems/ActionSystem';
import { playClick } from 'utils/sounds';

interface Props {
  account: Account; // account selected for viewing
  isSelf: boolean;
  actionSystem: ActionSystem;
  actions: {
    sendRequest: (account: Account) => void;
    acceptRequest: (request: any) => void;
  };
}

export const Bio = (props: Props) => {
  const { actionSystem, account, isSelf } = props;
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
    if (!account.ownerEOA) return null;
    const address = account.ownerEOA;
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
        <CakeIcon style={{ height: '1vw', width: '1vw' }} />
        <Description>{moment(1000 * account.time.creation).format('MMM DD, YYYY')}</Description>
      </DetailRow>
    );
  };

  const KillsRow = () => {
    return (
      <DetailRow>
        <CheckroomIcon style={{ height: '1vw', width: '1vw' }} />
        <Description>{account.stats?.kills ?? 0} Lives Claimed</Description>
      </DetailRow>
    );
  };

  const CoinRow = () => {
    return (
      <DetailRow>
        <TollIcon style={{ height: '1vw', width: '1vw' }} />
        <Description>{account.stats?.coin ?? 0} MUSU Collected</Description>
      </DetailRow>
    );
  };

  const MockupBar = () => {
    const mockupProgress = () => {
      let currentProgress = 0;
      return currentProgress;
    };

    return (
      <BarAndLevel>
        <Level style={{ fontSize: '0.6vw' }}>Lvl 1</Level>
        <Tooltip text={['0/40']}>
          <Bar>
            <Progress width={mockupProgress()} />
          </Bar>
        </Tooltip>
      </BarAndLevel>
    );
  };

  return (
    <Container key={account.name}>
      <Content>
        {' '}
        <Identifiers>
          <TitleRow>
            <Title>{account.name}</Title>
            {isSelf && (
              <FarcasterConnect account={account} actionSystem={actionSystem} size={1.2} />
            )}
          </TitleRow>
          <AddressDisplay />
        </Identifiers>
        <BirthdayRow />
        <KillsRow />
        <CoinRow />
        <MockupBar />
      </Content>
      <PfpContainer>
        <Tooltip text={[getLastSeenString()]}>
          <PfpStatus timeDelta={lastRefresh / 1000 - account.time.last} />
          <PfpImage src={account.pfpURI ?? 'https://miladymaker.net/milady/8365.png'} />
        </Tooltip>
      </PfpContainer>
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

const PfpImage = styled.img`
  border: solid black 0.15vw;
  border-radius: 10vw;
  width: 10vw;
  height: 10vw;
  object-fit: cover;
  object-position: 100% 0;
`;

const PfpStatus = styled.div<{ timeDelta: number }>`
  border: solid 0.2vw white;
  position: absolute;
  bottom: 0.9vw;
  right: 0.9vw;
  width: 1.2vw;
  height: 1.2vw;
  border-radius: 3vw;

  background-color: ${(props) => {
    if (props.timeDelta < 300) return '#6f3';
    else if (props.timeDelta < 1800) return '#fd3';
    else return '#f33';
  }};
`;

const BarAndLevel = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  --width: 12.5vw;
  position: relative;
  right: 6%;
`;

const Level = styled.div`
  width: 2.8vw;
  height: 2vw;
  border: 0.15vw solid #c2c0bf;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  --r: 1.5vw;
  margin: calc(tan(22.5deg) * var(--r));
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%) margin-box;
  --_g: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_s: calc(100% - (1 - tan(22.5deg)) * var(--r));
  background: #88a65e;
  color: white;
  text-shadow:
    -0.08vw -0.08vw 0 #434a46,
    0.08vw -0.08vw 0 #434a46,
    -0.08vw 0.08vw 0 #434a46,
    0.08vw 0.08vw 0 #434a46;
`;

const Bar = styled.div`
  width: var(--width);
  background-color: #f0f0f0;
  border: 0.15vw solid #c2c0bf;
  height: 1vw;
  padding: 0.1vw;
  border-radius: 0.3vw;
  margin-left: -0.4vw;
`;

const Progress = styled.div<{ width: number }>`
  width: ${({ width }) => width}%;
  height: 100%;
  border-radius: 3vw;
  transition: width 0.3s ease;
  background: repeating-linear-gradient(
    125deg,
    #98cd8d 0.01vw,
    #f6f0cf 0.01vw,
    #f6f0cf 0.05vw,
    #98cd8d 0.05vw,
    #98cd8d 0.2vw,
    #f6f0cf 0.2vw,
    #f6f0cf 0.3vw
  );
`;
