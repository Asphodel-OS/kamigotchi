import CakeIcon from '@mui/icons-material/Cake';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import TollIcon from '@mui/icons-material/Toll';
import moment from 'moment';
import styled from 'styled-components';

import { ItemImages } from 'assets/images/items';
import { Account } from 'network/shapes/Account';

interface Props {
  account: Account; // account selected for viewing
}

export const StatsBottom = (props: Props) => {
  const { account } = props;

  /////////////////
  // INTERPRETATION

  const getLastSeenString = () => {
    return `Last Seen: ${moment(1000 * account.time.last).fromNow()}`;
  };

  /////////////////
  // RENDERING

  return (
    <Container>
      <Content>
        <DetailRow>
          <CakeIcon style={{ height: '1.4vw' }} />
          <Description>{moment(1000 * account.time.creation).format('MMM DD, YYYY')}</Description>
        </DetailRow>
        <DetailRow>
          <CheckroomIcon style={{ height: '1.4vw' }} />
          <Description>{account.stats?.kills ?? 0} Lives Claimed</Description>
        </DetailRow>
        <DetailRow>
          <TollIcon style={{ height: '1.4vw' }} />
          <Description>{(account.stats?.coin ?? 0).toLocaleString()} MUSU Collected</Description>
        </DetailRow>
        <DetailRow>
          <VipIcon src={ItemImages.vipp} />
          <Description>{(account.stats?.vip ?? 0).toLocaleString()} VIP score</Description>
        </DetailRow>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0 0 0.6vw 0.6vw;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 0.45vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;

  overflow-y: auto;
`;

const Content = styled.div`
  width: 100%;
  padding: 0.5vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const DetailRow = styled.div`
  padding: 0.15vw 0;
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

const VipIcon = styled.img`
  width: 1.4vw;
`;
