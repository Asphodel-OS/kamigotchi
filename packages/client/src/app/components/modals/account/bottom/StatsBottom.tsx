import CheckroomIcon from '@mui/icons-material/Checkroom';
import TollIcon from '@mui/icons-material/Toll';
import styled from 'styled-components';

import { ItemImages } from 'assets/images/items';
import { Account } from 'network/shapes/Account';
import { Factions } from '../Factions';

export const StatsBottom = ({
  data: {
    account,
    vip
  },
}: {
  data: {
    account: Account;
    vip: {
      epoch: number; // current VIP epoch
      total: number; // total VIP this epoch
    };
  };
}) => {
  /////////////////
  // INTERPRETATION

  const getVIPText = () => {
    const { epoch, total } = vip;
    const playerScore = (account.stats?.vip ?? 0).toLocaleString();
    const aggregateScore = total.toLocaleString();
    return `${playerScore} VIP Score (epoch ${epoch}: ${aggregateScore} total)`;
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
          <Description>{getVIPText()}</Description>
        </DetailRow>
      </Content>
      <Factions data={{ account }} />
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15em black;
  border-radius: 0 0 0.6em 0.6em;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 0.45em;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;

  overflow-y: auto;
  align-items: flex-start;

  user-select: none;
`;

const Content = styled.div`
  width: 100%;
  padding: 0.5em;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const DetailRow = styled.div`
  padding: 0.15em 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3em;
`;

// needed to have the vip icon align with the mui icons
const IconWrapper = styled.div`
  height: 1.4em;
  width: 1.4em;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Description = styled.div`
  font-size: 0.7em;
  font-family: Pixel;
  line-height: 0.9em;
  text-align: left;
  padding-top: 0.2em;
`;

const VipIcon = styled.img`
  height: 100%;
  width: 100%;
  object-fit: contain;
`;
