import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Goal } from 'layers/network/shapes/Goal';
import { DetailedEntity } from 'layers/network/shapes/utils/EntityTypes';
import { HelpIcon } from 'layers/react/components/library/HelpIcon';
import { ItemIconHorizontal } from 'layers/react/components/library/ItemIconHorizontal';

interface Props {
  goal: Goal;
  getDescribedEntity: (type: string, index: number) => DetailedEntity;
}

// type to store a process reward's DetailedEntity and balance
interface Reward {
  entity: DetailedEntity;
  type: string; // condition logic - either PROPORTIONAL, EQUAL, or DISPLAY_ONLY
  balance: number;
}

// the table rendering of the leaderboard modal
export const Details = (props: Props) => {
  const { goal, getDescribedEntity } = props;

  const [individualRwds, setIndividualRwds] = useState<Reward[]>([]);
  const [communityRwds, setCommunityRwds] = useState<Reward[]>([]);

  useEffect(() => {
    const rewards = props.goal.rewards.map((r) => ({
      entity: getDescribedEntity(r.target.type, r.target.index ?? 0),
      type: r.logic,
      balance: (r.target.value ?? 0) * 1,
    }));
    setIndividualRwds(rewards.filter((r) => r.type === 'PROPORTIONAL'));
    setCommunityRwds(rewards.filter((r) => r.type === 'EQUAL' || r.type === 'DISPLAY_ONLY'));
  }, [goal]);

  ////////////////
  // SMALL DISPLAYS

  const RewardsRow = (rewards: Reward[]) => {
    return (
      <Row>
        {rewards.map((reward) => (
          <ItemIconHorizontal
            item={reward.entity}
            size='small'
            balance={reward.balance}
            styleOverride={{ box: { borderColor: '#444' } }}
          />
        ))}
      </Row>
    );
  };

  const CommunityBox = () => {
    if (communityRwds.length === 0) return <></>;
    return (
      <Box>
        <Row>
          <SmallTitleText>Community</SmallTitleText>
          <HelpIcon tooltip={['A prize pool that is split according to contribution.']} />
        </Row>
        {RewardsRow(communityRwds)}
      </Box>
    );
  };

  const IndividualBox = () => {
    if (individualRwds.length === 0) return <></>;
    return (
      <Box>
        <Row>
          <SmallTitleText>Individual</SmallTitleText>
          <HelpIcon tooltip={['All participants get these rewards.']} />
        </Row>
        {RewardsRow(individualRwds)}
      </Box>
    );
  };

  ////////////////
  // BIG DISPLAYS

  const DescriptionBox = (
    <Box style={{ marginTop: '0' }}>
      <TitleText>{props.goal.name}</TitleText>
      <DescriptionText>{props.goal.description}</DescriptionText>
    </Box>
  );

  const RewardsBox = (
    <div>
      <SubTitleText>Rewards</SubTitleText>
      <Row>
        {IndividualBox()}
        {CommunityBox()}
      </Row>
    </div>
  );

  return (
    <Container>
      {DescriptionBox}
      {RewardsBox}
    </Container>
  );
};

const Box = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: flex-start;
  padding: 1vh 1vw;
`;

const Container = styled.div`
  margin: 0vh 1vw 0;
`;

const TitleText = styled.h1`
  font-size: 1.8vw;
  font-family: Pixel;
  text-align: left;
  color: #333;
`;

const DescriptionText = styled.p`
  font-size: 0.8vw;
  line-height: 1.2vw;
  font-family: Pixel;
  text-align: left;
  color: #333;

  padding: 1vh 0.4vw 0.25vh;
`;

const SubTitleText = styled.h2`
  font-size: 1.2vw;
  font-family: Pixel;
  text-align: left;
  color: #333;

  padding: 0 1vw;
`;

const SmallTitleText = styled.h3`
  font-size: 0.8vw;
  font-family: Pixel;
  text-align: left;
  padding-left: 0.5vw;
  color: #666;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: center;

  max-width: 100%;
`;
