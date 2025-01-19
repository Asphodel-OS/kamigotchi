import CakeIcon from '@mui/icons-material/Cake';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import TollIcon from '@mui/icons-material/Toll';
import moment from 'moment';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { Tooltip } from 'app/components/library';
import { MockupBar } from 'app/components/library/base/measures/ExperienceBar';
import { Popover } from 'app/components/library/base/Popover';
import { useNetwork } from 'app/stores';
import { BigNumberish } from 'ethers';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
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
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
  };
  api: any;
}

export const Bio = (props: Props) => {
  const { actionSystem, account, isSelf, utils, api } = props;
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const { getAccountKamis } = utils;
  const { selectedAddress, apis } = useNetwork();
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

  const pfpTx = (kamiID: BigNumberish) => {
    if (!api) return console.error(`API not established for ${selectedAddress}`);

    const actionID = uuid() as EntityID;
    actionSystem!.add({
      id: actionID,
      action: 'UpdatePfp',
      params: [kamiID],
      description: `Updating account pfp.`,
      execute: async () => {
        return api.player.account.set.pfp(kamiID);
      },
    });
    return actionID;
  };

  const pfpHandler = () => {
    return getAccountKamis(account.entity).map((kami) => (
      <PfpHandler key={kami.id} onClick={() => pfpTx(kami.id)}>
        {kami.name}
      </PfpHandler>
    ));
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
        <MockupBar />
      </Content>

      <PfpContainer>
        <Popover key='profile' content={pfpHandler()}>
          <Tooltip text={[getLastSeenString()]}>
            <PfpStatus timeDelta={lastRefresh / 1000 - account.time.last} />
            <PfpImage src={account.pfpURI ?? 'https://miladymaker.net/milady/8365.png'} />{' '}
          </Tooltip>{' '}
        </Popover>
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
const PfpHandler = styled.div`
  padding: 0.5vw;
  &:hover {
    cursor: pointer;
  }
`;
