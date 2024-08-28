import styled from 'styled-components';

import { KamiCard } from 'app/components/library';
import { CollectButton, FeedButton, StopButton } from 'app/components/library/actions';
import { Account } from 'network/shapes/Account';
import { Kami, calcHealth, calcOutput } from 'network/shapes/Kami';

interface Props {
  account: Account;
  kamis: Kami[];
  actions: {
    collect: (kami: Kami) => void;
    feed: (kami: Kami, itemIndex: number) => void;
    stop: (kami: Kami) => void;
  };
}

// rendering of an ally kami on this node
export const AllyKards = (props: Props) => {
  const { actions, kamis, account } = props;
  const { collect, feed, stop } = actions;
  const display = kamis.length > 0 ? 'flex' : 'none';

  // get the description on the card
  const getDescription = (kami: Kami): string[] => {
    const health = calcHealth(kami);
    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats.health.total}`,
      `Harmony: ${kami.stats.harmony.total}`,
      `Violence: ${kami.stats.violence.total}`,
    ];
    return description;
  };

  return (
    <Container style={{ display }}>
      <Title>Allies</Title>
      {kamis.map((kami: Kami) => (
        <KamiCard
          key={kami.index}
          kami={kami}
          description={getDescription(kami)}
          subtext={`yours (\$${calcOutput(kami)})`}
          actions={[
            FeedButton(kami, account, feed),
            CollectButton(kami, account, collect),
            StopButton(kami, account, stop),
          ]}
          showBattery
          showCooldown
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6vw;
  gap: 0.45vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Title = styled.div`
  font-size: 1.2vw;
  color: #333;
  text-align: left;
  padding: 0.2vw;
  padding-top: 0.8vw;
`;
