import { useState } from 'react';
import styled from 'styled-components';

import { calcHealth, calcOutput } from 'app/cache/kami';
import { CollectButton, KamiCard, Pairing, StopButton } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { StatColors, StatIcons } from 'constants/stats';
import { Node } from 'network/shapes';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

// rendering of an ally kami on this node
export const AllyKards = ({
  actions,
  data,
  display,
  utils,
}: {
  actions: {
    collect: (kami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  data: {
    account: Account;
    kamis: Kami[]; // ally kami entities
    node: Node;
  };
  display: {
    UseItemButton: (kami: Kami, account: Account) => React.ReactNode;
  };
  utils: {
    getTempBonuses: (kami: Kami) => Bonus[];
  };
}) => {
  const { collect, stop } = actions;
  const { account, kamis } = data;
  const { UseItemButton } = display;
  const { getTempBonuses } = utils;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapseToggle = () => {
    playClick();
    setIsCollapsed(!isCollapsed);
  };

  /////////////////
  // DISPLAY

  // generate the content section for a Kami
  const StatsDisplay = ({ kami }: { kami: Kami }) => {
    const stats = kami.stats;
    if (!stats) return <></>;

    const power = stats.power.total;
    const violence = stats.violence.total;
    const harmony = stats.harmony.total;
    const health = calcHealth(kami);
    const healthText = `${health.toFixed()} / ${stats?.health.total ?? 0}`;

    return (
      <Column>
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
      </Column>
    );
  };

  /////////////////
  // RENDER

  return (
    <Container style={{ display: kamis.length > 0 ? 'flex' : 'none' }}>
      <StickyRow>
        <Title onClick={handleCollapseToggle}>
          {`${isCollapsed ? '▶' : '▼'} Allies(${kamis.length})`}
        </Title>
      </StickyRow>
      {!isCollapsed &&
        kamis.map((kami: Kami, i: number) => (
          <KamiCard
            key={kami.index}
            kami={kami}
            description={['']}
            content={<StatsDisplay kami={kami} />}
            label={{ text: `${calcOutput(kami)}`, icon: ItemImages.musu }}
            actions={[
              UseItemButton(kami, account),
              CollectButton(kami, account, collect),
              StopButton(kami, account, stop),
            ]}
            utils={{ getTempBonuses }}
            showBattery
            showCooldown
          />
        ))}
    </Container>
  );
};

const Container = styled.div`
  padding: 0 0.6vw 0.6vw 0.6vw;
  gap: 0.45vw;
  display: flex;
  flex-flow: column nowrap;
`;

const StickyRow = styled.div`
  position: sticky;
  z-index: 1;
  top: 0;

  background-color: white;
  opacity: 0.9;
  width: 100%;

  padding: 0.3vw 0 0.3vw 0;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  user-select: none;
`;

const Title = styled.div`
  font-size: 1.2vw;
  line-height: 2.4vw;
  color: #333;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const Column = styled.div`
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
