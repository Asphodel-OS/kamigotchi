import styled from 'styled-components';

import { calcHealth, calcOutput } from 'app/cache/kami';
import { CollectButton, KamiCard, StopButton } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';

interface Props {
  account: Account;
  kamis: Kami[]; // ally kami entities
  bonuses: string[][];
  actions: {
    collect: (kami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  display: {
    UseItemButton: (kami: Kami, account: Account) => React.ReactNode;
  };
}

// rendering of an ally kami on this node
export const AllyKards = (props: Props) => {
  const { actions, display, account, kamis, bonuses } = props;
  const { collect, stop } = actions;
  const { UseItemButton } = display;

  /////////////////
  // INTERPRETATION

  // get the description on the card
  const getDescription = (kami: Kami): string[] => {
    const health = calcHealth(kami);
    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats?.health.total ?? 0}`,
      `Harmony: ${kami.stats?.harmony.total ?? 0}`,
      `Violence: ${kami.stats?.violence.total ?? 0}`,
    ];
    return description;
  };

  return (
    <Container style={{ display: kamis.length > 0 ? 'flex' : 'none' }}>
      <Title>Allies</Title>
      {kamis.map((kami: Kami, i: number) => (
        <KamiCard
          key={kami.index}
          kami={kami}
          description={getDescription(kami)}
          titleTooltip={bonuses[i]}
          subtext={`yours (\$${calcOutput(kami)})`}
          actions={[
            UseItemButton(kami, account),
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
