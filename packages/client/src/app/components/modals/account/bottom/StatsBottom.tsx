import CheckroomIcon from '@mui/icons-material/Checkroom';
import TollIcon from '@mui/icons-material/Toll';
import moment from 'moment';
import styled from 'styled-components';

import { ItemImages } from 'assets/images/items';
import { Account } from 'network/shapes/Account';
import { Factions } from '../Factions';

interface Props {
  data: { account: Account };
}

export const StatsBottom = (props: Props) => {
  const { data } = props;
  const { account } = data;

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
          <IconWrapper>
            <CheckroomIcon style={{ height: '100%', width: '100%' }} />
          </IconWrapper>
          <Description>{account.stats?.kills ?? 0} Lives Claimed</Description>
        </DetailRow>
        <DetailRow>
          <IconWrapper>
            <TollIcon style={{ height: '100%', width: '100%' }} />
          </IconWrapper>
          <Description>{(account.stats?.coin ?? 0).toLocaleString()} MUSU Collected</Description>
        </DetailRow>
        <DetailRow>
          <IconWrapper>
            <VipIcon src={ItemImages.vipp} />
          </IconWrapper>
          <Description>{(account.stats?.vip ?? 0).toLocaleString()} VIP score</Description>
        </DetailRow>
      </Content>{' '}
      <Factions data={{ account }} />
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

  overflow-y: auto;
  align-items: flex-start;
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

// needed to have the vip icon align with the mui icons
const IconWrapper = styled.div`
  height: 1.4vw;
  width: 1.4vw;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Description = styled.div`
  font-size: 0.7vw;
  font-family: Pixel;
  line-height: 0.9vw;
  text-align: left;
  padding-top: 0.2vw;
`;

const VipIcon = styled.img`
  height: 100%;
  width: 100%;
  object-fit: contain;
`;
