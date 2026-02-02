import styled from 'styled-components';

import { Kami } from 'app/cache/kami';
import { Pairing, TextTooltip } from 'app/components/library';
import { StatBorderColors, StatColors, StatIcons } from 'constants/stats';
import { getAffinityImage } from 'network/shapes/utils';

// generate the content section for a Kami
export const StatsDisplay = ({ kami }: { kami: Kami }) => {
  const power = kami.stats?.power.total ?? 0;
  const violence = kami.stats?.violence.total ?? 0;
  const harmony = kami.stats?.harmony.total ?? 0;
  const bodyAffinity = kami.traits?.body.affinity ?? 'UNKOWN';
  const handAffinity = kami.traits?.hand.affinity ?? 'UNKOWN';

  return (
    <Container>
      <TextTooltip text={[`Body: ${bodyAffinity}`, `Hand: ${handAffinity}`]} alignText='left'>
        <Affinities>
          <Affinity>
            <Icon src={getAffinityImage(bodyAffinity)} />
          </Affinity>
          <Slash>/</Slash>
          <Affinity>
            <Icon src={getAffinityImage(handAffinity)} />
          </Affinity>
        </Affinities>
      </TextTooltip>
      <Row>
        <Pairing
          icon={StatIcons.power}
          text={`${power}`}
          iconSize={0.9}
          textSize={0.6}
          background={{ gradient: StatColors.power, border: StatBorderColors.power }}
        />
        <Pairing
          icon={StatIcons.violence}
          text={`${violence}`}
          iconSize={0.9}
          textSize={0.6}
          background={{ gradient: StatColors.violence, border: StatBorderColors.violence }}
        />
        <Pairing
          icon={StatIcons.harmony}
          text={`${harmony}`}
          iconSize={0.9}
          textSize={0.6}
          background={{ gradient: StatColors.harmony, border: StatBorderColors.harmony }}
        />
      </Row>
    </Container>
  );
};

const Container = styled.div`
  padding: 0 0.3vw;
  gap: 0.45vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 0.6vw;
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
`;

const Affinities = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.2vw;
  border: solid black 0.15vw;
  border-radius: 0.3vw;
  padding: 0.3vw 0.5vw;
  font-size: 0.6vw;

  filter: sepia(1) saturate(100%);
  background-color: #ffffd6;
  border: solid 0.15vw #4e4e03ff;
`;

const Affinity = styled.span`
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const Slash = styled.span`
  font-size: 0.9vw;
`;
