import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { CollectButton, StopButton } from 'app/components/library/actions';
import { Account } from 'network/shapes/Account';
import { Kami, KamiOptions, calcHealth, calcOutput } from 'network/shapes/Kami';
import { KamiCard } from '../KamiCard/KamiCard';

interface Props {
  account: Account;
  kamis: Kami[]; // ally kami entities
  actions: {
    collect: (kami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  display: {
    UseItemButton: (kami: Kami, account: Account) => React.ReactNode;
  };
  utils: {
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
    refreshKami: (kami: Kami) => Kami;
  };
}

// rendering of an ally kami on this node
export const AllyKards = (props: Props) => {
  const { actions, display, account, kamis } = props;
  const { collect, stop } = actions;
  const { UseItemButton } = display;

  /////////////////
  // INTERPRETATION

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
    <Container style={{ display: kamis.length > 0 ? 'flex' : 'none' }}>
      <Title>Allies</Title>
      {kamis.map((kami: Kami) => (
        <KamiCard
          key={kami.index}
          kami={kami}
          description={getDescription(kami)}
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
