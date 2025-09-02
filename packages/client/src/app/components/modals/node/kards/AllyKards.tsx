import { useState } from 'react';
import styled from 'styled-components';

import { calcHealth, calcOutput } from 'app/cache/kami';
import { CollectButton, KamiCard, StopButton } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Bonus, parseBonusText } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

// rendering of an ally kami on this node
export const AllyKards = ({
  account,
  kamis,
  actions: {
    collect,
    stop,
  },
  display: {
    UseItemButton,
  },
  utils: {
    getTempBonuses,
  },
}: {
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
    getTempBonuses: (kami: Kami) => Bonus[];
  };
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapseToggle = () => {
    playClick();
    setIsCollapsed(!isCollapsed);
  };

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

  const getItemBonusesDescription = (kami: Kami) => {
    const bonuses = getTempBonuses(kami);
    return bonuses.map((bonus) => parseBonusText(bonus));
  };

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
            description={getDescription(kami)}
            subtext={`yours (\$${calcOutput(kami)})`}
            actions={[
              UseItemButton(kami, account),
              CollectButton(kami, account, collect),
              StopButton(kami, account, stop),
            ]}
            showBattery
            showCooldown
            utils={{ getTempBonuses }}
          />
        ))}
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6em;
  gap: 0.45em;
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

  padding: 0.3em 0 0.3em 0;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  user-select: none;
`;

const Title = styled.div`
  font-size: 1.2em;
  line-height: 1.8em;
  color: #333;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;
