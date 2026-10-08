import styled from 'styled-components';

import {
  formatCompact,
  getTierColors,
  Palette,
  RewardChip,
  SpeechCard,
} from 'app/components/library/pastel';
import { groupSpeech, parseSpeech } from 'constants/dialogue/speech';
import { Contribution, Goal, Tier } from 'network/shapes/Goals';
import { DetailedEntity } from 'network/shapes/utils';

// the client shapes DISPLAY_ONLY_ rewards into a cutoff-0 "Community" tier with the prefix stripped
const isCommunityTier = (tier: Tier) => tier.name === 'Community' && Number(tier.cutoff) === 0;

export const Details = ({
  goal,
  accContribution,
  unit,
  getFromDescription,
}: {
  goal: Goal;
  accContribution?: Contribution;
  unit: string;
  getFromDescription: (type: string, index: number) => DetailedEntity;
}) => {
  const groups = groupSpeech(parseSpeech(goal.description));
  const community = goal.tiers.filter(isCommunityTier);
  const tiers = goal.tiers.filter((t) => !isCommunityTier(t)).sort((a, b) => a.cutoff - b.cutoff);
  const contributed = Number(accContribution?.value ?? 0);

  /////////////////
  // DISPLAY

  const CommunityStrip = () => {
    const texts = community.flatMap((t) => t.rewards.map((r) => r.type).filter(Boolean));
    if (texts.length === 0) return null;
    return (
      <Community>
        <CommunityLabel>Community Reward</CommunityLabel>
        <CommunityText>{texts.join(' · ')}</CommunityText>
      </Community>
    );
  };

  const objective = goal.objective.target;
  const objEntity = getFromDescription(objective.type, objective.index ?? 0);

  const TierCard = (tier: Tier) => {
    const { bg, edge } = getTierColors(tier.name);
    const proportional = tier.name === 'Proportional';
    const reached = tier.cutoff > 0 && contributed >= tier.cutoff;
    return (
      <Card key={tier.id} style={{ background: bg, borderColor: reached ? Palette.ink : edge }}>
        <CardHead>
          <TierName>{tier.name}</TierName>
          {reached && <Reached>✓ Reached</Reached>}
        </CardHead>
        <Group>
          <GroupLabel>Contribute</GroupLabel>
          <RewardChip
            entity={objEntity}
            badge={proportional ? 'any' : formatCompact(tier.cutoff)}
          />
        </Group>
        <Divider style={{ borderColor: edge }} />
        <Group>
          <GroupLabel>Rewards</GroupLabel>
          <Chips>
            {tier.rewards.map((reward, i) => (
              <RewardChip
                key={`reward-${tier.id}-${i}`}
                entity={getFromDescription(reward.type, reward.index ?? 0)}
                amount={reward.value ?? 0}
              />
            ))}
          </Chips>
        </Group>
      </Card>
    );
  };

  return (
    <Container>
      <Dialogue>
        {groups.map((group, i) => (
          <SpeechCard key={`speech-${i}`} group={group} />
        ))}
      </Dialogue>
      <Section>
        <SectionHead>
          <SectionTitle>Rewards</SectionTitle>
          <Hint>Tiers stack: reaching a tier also pays every tier below it.</Hint>
        </SectionHead>
        <Cards
          style={{ gridTemplateColumns: `repeat(${Math.max(tiers.length, 1)}, minmax(0, 1fr))` }}
        >
          {tiers.map(TierCard)}
        </Cards>
      </Section>
      <CommunityStrip />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1vw;
  padding: 0 1.4vw 1vw;
`;

const Dialogue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8vw;
  padding: 0.9vw;
  background: ${Palette.soft};
  border: solid ${Palette.line} 0.12vw;
  border-radius: 0.8vw;
`;

const Community = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
  padding: 0.5vw 0.8vw;
  background: ${Palette.neutral.bg};
  border: solid ${Palette.neutral.edge} 0.12vw;
  border-radius: 0.6vw;
`;

const CommunityLabel = styled.span`
  font-family: Pixel;
  font-size: 0.6vw;
  text-transform: uppercase;
  letter-spacing: 0.05vw;
  color: ${Palette.muted};
`;

const CommunityText = styled.span`
  font-family: Pixel;
  font-size: 0.72vw;
  color: ${Palette.ink};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1vw;
`;

const SectionTitle = styled.h2`
  font-family: Pixel;
  font-size: 0.95vw;
  color: ${Palette.ink};
`;

const Hint = styled.span`
  font-family: Pixel;
  font-size: 0.58vw;
  color: ${Palette.faint};
`;

const Cards = styled.div`
  display: grid;
  gap: 0.8vw;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8vw;
  padding: 0.7vw 0.8vw 0.9vw;
  border: solid 0.15vw;
  border-radius: 0.8vw;
  min-width: 0;
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4vw;
  min-height: 1.2vw;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45vw;
`;

const GroupLabel = styled.span`
  font-family: Pixel;
  font-size: 0.5vw;
  text-transform: uppercase;
  letter-spacing: 0.06vw;
  color: ${Palette.muted};
`;

const Divider = styled.div`
  border-top: dashed 0.1vw;
  opacity: 0.7;
`;

const TierName = styled.span`
  font-family: Pixel;
  font-size: 0.85vw;
  color: ${Palette.ink};
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75vw;
`;

const Reached = styled.span`
  font-family: Pixel;
  font-size: 0.6vw;
  color: ${Palette.progress.edge};
`;
