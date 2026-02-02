import { useState } from 'react';
import styled from 'styled-components';

import { getHarvestItem } from 'app/cache/harvest';
import { calcOutput } from 'app/cache/kami';
import { CollectButton, KamiCard, StopButton } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { StatsDisplay } from './StatsDisplay';

// rendering of an ally kami on this node
export const AllyKards = ({
  actions,
  data,
  display,
  utils,
  tick,
}: {
  actions: {
    collect: (kami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  data: {
    account: Account;
    kamis: Kami[]; // ally kami entities
  };
  display: {
    UseItemButton: (kami: Kami, account: Account) => React.ReactNode;
  };
  utils: {
    getTempBonuses: (kami: Kami) => Bonus[];
  };
  tick: number;
}) => {
  const { collect, stop } = actions;
  const { account, kamis } = data;
  const { UseItemButton } = display;
  const { getTempBonuses } = utils;
  const [isCollapsed, setIsCollapsed] = useState(false);

  /////////////////
  // INTERACTION

  // collapse and expand the list
  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
    playClick();
  };

  // get the harvest balance label for a kami
  const getLabel = (kami: Kami) => {
    if (!kami.harvest) return { text: '0', icon: '' };
    const harvestOutput = calcOutput(kami);
    const harvestItem = getHarvestItem(kami.harvest);
    return { text: `${harvestOutput}`, icon: harvestItem.image };
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
            actions={[
              UseItemButton(kami, account),
              CollectButton(kami, account, collect),
              StopButton(kami, account, stop),
            ]}
            content={<StatsDisplay kami={kami} />}
            label={getLabel(kami)}
            utils={{ getTempBonuses }}
            show={{
              battery: true,
              cooldown: true,
            }}
            tick={tick}
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
  z-index: 2;
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
