import styled from 'styled-components';

import { calcHealth, Kami } from 'app/cache/kami';
import { Pairing } from 'app/components/library';
import { StatColors, StatIcons } from 'constants/stats';

// generate the content section for a Kami
export const StatsDisplay = ({ kami }: { kami: Kami }) => {
  const stats = kami.stats;
  if (!stats) return <></>;

  const power = stats.power.total;
  const violence = stats.violence.total;
  const harmony = stats.harmony.total;
  const health = calcHealth(kami);
  const healthText = `${health.toFixed()} / ${stats?.health.total ?? 0}`;

  return (
    <Container>
      <Pairing
        icon={StatIcons.health}
        text={healthText}
        iconSize={0.9}
        textSize={0.6}
        background={{ gradient: StatColors.health }}
      />
      <Row>
        <Pairing
          icon={StatIcons.power}
          text={`${power}`}
          iconSize={0.9}
          textSize={0.6}
          background={{ gradient: StatColors.power }}
        />
        <Pairing
          icon={StatIcons.violence}
          text={`${violence}`}
          iconSize={0.9}
          textSize={0.6}
          background={{ gradient: StatColors.violence }}
        />
        <Pairing
          icon={StatIcons.harmony}
          text={`${harmony}`}
          iconSize={0.9}
          textSize={0.6}
          background={{ gradient: StatColors.harmony }}
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
