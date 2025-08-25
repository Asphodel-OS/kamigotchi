import styled from 'styled-components';

import { HelpChip } from 'app/components/library';
import { Goal, Tier } from 'network/shapes/Goals';
import { DetailedEntity } from 'network/shapes/utils';
import { ItemIconHorizontal } from './ItemIconHorizontal';

export const Details = ({
  goal,
  getFromDescription,
}: {
  goal: Goal;
  getFromDescription: (type: string, index: number) => DetailedEntity;
}) => {
  ////////////////
  // SMALL DISPLAYS

  const TierBox = (tier: Tier) => {
    const helpText =
      tier.cutoff > 0
        ? `Have a contribution score of at least ${tier.cutoff}`
        : 'Everyone gets this';
    return (
      <Box key={tier.name} style={{ padding: '0 0.4vw' }}>
        <Row>
          <SmallTitleText>{tier.name}</SmallTitleText>
          <HelpChip tooltip={[helpText]} />
        </Row>

        <Row>
          {tier.rewards.map((reward, i) => (
            <ItemIconHorizontal
              key={`reward-${tier.name}-${i}`}
              item={getFromDescription(reward.type, reward.index ?? 0)}
              size='small'
              balance={reward.value ?? 0}
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
      <TitleText>{goal.name}</TitleText>
      <DescriptionText>{goal.description}</DescriptionText>
    </Box>
  );

  const RewardsBox = (
    <div>
      <SubTitleText>Rewards</SubTitleText>
      <Row style={{ justifyContent: 'flex-start', padding: '1vh 1vw' }}>
        {goal.tiers.map((tier) => {
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
