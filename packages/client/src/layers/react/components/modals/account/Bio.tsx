import CakeIcon from '@mui/icons-material/Cake';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import TollIcon from '@mui/icons-material/Toll';
import moment from "moment";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { Account } from "layers/network/shapes/Account";
import { Tooltip } from "../../library";
import { playClick } from "utils/sounds";


interface Props {
  account: Account;
  actions: {
    sendRequest: (account: Account) => void;
    acceptRequest: (request: any) => void;
  }
}

export const Bio = (props: Props) => {
  const { actions, account } = props;
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
    return `Last Seen: ${moment(1000 * account.time.last).fromNow()}`
  }


  /////////////////
  // RENDERING

  const AddressDisplay = () => {
    if (!account.ownerEOA) return null;
    const address = account.ownerEOA;
    const addrPrefix = address.slice(0, 6);
    const addrSuffix = address.slice(-4);
    return (
      <Tooltip text={[address]}>
        <Subtitle onClick={() => copyText(address)} >
          {addrPrefix}...{addrSuffix}
        </Subtitle>
      </Tooltip>
    );
  }

  const BirthdayRow = () => {
    if (!account.time.creation) return null;
    return (
      <DetailRow>
        <CakeIcon style={{ height: '1vw', width: '1vw' }} />
        <Description>{moment(1000 * account.time.creation).format('MMM DD, YYYY')}</Description>
      </DetailRow>
    );
  }

  const KillsRow = () => {
    return (
      <DetailRow>
        <CheckroomIcon style={{ height: '1vw', width: '1vw' }} />
        <Description>{account.stats?.kills ?? 0} Lives Claimed</Description>
      </DetailRow>
    );
  }

  const CoinRow = () => {
    return (
      <DetailRow>
        <TollIcon style={{ height: '1vw', width: '1vw' }} />
        <Description>{account.stats?.coin ?? 0} $MUSU Collected</Description>
      </DetailRow>
    );
  }

  return (
    <Container key={account.name}>
      <Content>
        <Identifiers>
          <Title>{account.name}</Title>
          <AddressDisplay />
        </Identifiers>
        <BirthdayRow />
        <KillsRow />
        <CoinRow />
      </Content>
      <PfpContainer>
        <Tooltip text={[getLastSeenString()]}>
          <PfpStatus timeDelta={lastRefresh - 1000 * account.time.last} />
          <PfpImage src='https://images.blur.io/_blur-prod/0x5af0d9827e0c53e4799bb226655a1de152a425a5/833-07dc63fc2ea1b5a5?w=1000' />
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
  padding: .5vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const Identifiers = styled.div`
  padding-bottom: .6vw;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
`;

const Title = styled.div`
  font-family: Pixel;
  font-size: 1.2vw;
`;

const Subtitle = styled.div`
  color: #777;
  padding: .5vw;
  flex-grow: 1;

  font-family: Pixel;
  font-size: 0.7vw;

  cursor: copy;
`;

const DetailRow = styled.div`
  padding: .3vw 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: .3vw;
`;

const Description = styled.div`
  font-size: 0.7vw;
  font-family: Pixel;
  line-height: .9vw;
  text-align: left;
  padding-top: .2vw;
`;

const PfpContainer = styled.div`
  position: relative;
  width: 10vw;
  height: 10vw;
`;

const PfpStatus = styled.div<{ timeDelta: number }>`
  border: solid .18vw white;
  position: absolute;
  bottom: .9vw;
  right: .9vw;
  width: 1.2vw;
  height: 1.2vw;
  border-radius: 3vw;


  background-color: ${props => {
    if (props.timeDelta < 60000) return '#6f0';
    else if (props.timeDelta < 600000) return '#fd0';
    else return '#f33';
  }};
`;

const PfpImage = styled.img`
  border: solid black .15vw;
  border-radius: 10vw;
  width: 10vw;
  height: 10vw;
  object-fit: cover;
  object-position: 100% 0;
`;
