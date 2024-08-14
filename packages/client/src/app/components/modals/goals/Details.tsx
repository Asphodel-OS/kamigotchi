import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { HelpIcon, ItemIconHorizontal } from 'app/components/library';
import { Goal, sortRewards } from 'network/shapes/Goal';
import { DetailedEntity } from 'network/shapes/utils';

interface Props {
  goal: Goal;
  getDescribedEntity: (type: string, index: number) => DetailedEntity;
}

// type to store a process reward's DetailedEntity and balance
interface DisplayRwd {
  entity: DetailedEntity;
  tier: string; // tier name
  balance: number;
}

interface RewardTier {
  name: string;
  rewards: DisplayRwd[];
  cutoff: number;
}

export const Details = (props: Props) => {
  const { goal, getDescribedEntity } = props;

  const [displayRwds, setDisplayRwds] = useState<RewardTier[]>([]);

  useEffect(() => {
    const sortedRaw = sortRewards(props.goal.rewards);

    // converts rewards into something displayable
    const rewards: RewardTier[] = [];
    sortedRaw.forEach((value, key) => {
      rewards.push({
        name: key,
        rewards: value.map((rwd) => ({
          entity: getDescribedEntity(rwd.target.type, rwd.target.index ?? 0),
          tier: key,
          balance: (rwd.target.value ?? 0) * 1,
        })),
        cutoff: value[0].cutoff * 1,
      });
    });
    setDisplayRwds(rewards);
  }, [goal]);

  ////////////////
  // SMALL DISPLAYS

  const TierBox = (tier: RewardTier) => {
    const helpText =
      tier.cutoff > 0
        ? `Have a contribution score of at least ${tier.cutoff}`
        : 'Everyone gets this';
    return (
      <Box key={tier.name} style={{ padding: '0 0.4vw' }}>
        <Row>
          <SmallTitleText>{tier.name}</SmallTitleText>
          <HelpIcon tooltip={[helpText]} />
        </Row>

        <Row>
          {tier.rewards.map((reward, i) => (
            <ItemIconHorizontal
              key={`reward-${tier.name}-${i}`}
              item={reward.entity}
              size='small'
              balance={reward.balance}
              styleOverride={{ box: { borderColor: '#444', marginBottom: '0' } }}
            />
          ))}
        </Row>
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
      <Row style={{ justifyContent: 'flex-start', padding: '1vh 1vw' }}>
        {displayRwds.map((tier) => {
          return TierBox(tier);
        })}
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
  row-gap: 0.75vh;

  max-width: 100%;
`;
