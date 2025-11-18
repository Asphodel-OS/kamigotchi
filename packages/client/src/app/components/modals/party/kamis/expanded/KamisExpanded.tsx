import styled from 'styled-components';

import { getHarvestItem } from 'app/cache/harvest';
import { calcOutput, isDead, isHarvesting } from 'app/cache/kami';
import { KamiCard } from 'app/components/library';
import { FeedIcon, ReviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { getRateDisplay } from 'utils/numbers';
import { StatusDisplay } from './StatusDisplay';

export const KamisExpanded = ({
  data: { account, node },
  display: { HarvestButton, UseItemButton },
  state: { displayedKamis, tick },
  utils,
  isVisible,
}: {
  data: {
    account: Account;
    kamis: Kami[];
    node: Node;
  };
  display: {
    HarvestButton: (account: Account, kami: Kami, node: Node) => JSX.Element;
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
  };
  state: {
    displayedKamis: Kami[];
    tick: number;
  };
  utils: {
    calcExpRequirement: (lvl: number) => number;
    getTempBonuses: (kami: Kami) => Bonus[];
  };

  isVisible: boolean;
}) => {
  /////////////////
  // INTERPRETATION

  // get the balance subtext for a kami
  // TODO: update this with iconography
  const getSubtext = (kami: Kami) => {
    const harvest = kami.harvest;
    if (!harvest || harvest.state != 'ACTIVE') return;
    const item = getHarvestItem(harvest);
    return { text: `${calcOutput(kami)}`, icon: item.image };
  };

  // get the description tooltip on the kami card
  // NOTE: unused atm, rerendering frequency causes issues with orphaned tooltips
  const getTooltip = (kami: Kami): string[] => {
    const tooltip: string[] = [];
    if (isHarvesting(kami) && kami.harvest) {
      const harvest = kami.harvest;
      const avgRate = getRateDisplay(harvest.rates.total.average, 2);
      const item = getHarvestItem(harvest);
      const now = Math.floor(Date.now() / 1000);
      const lastDuration = (now - harvest.time.last) / 3600;
      tooltip.push(`Average: ${avgRate} ${item.name}/hr`);
      tooltip.push(`> over the last ${lastDuration.toFixed(2)}hours`);
    }
    return tooltip;
  };

  /////////////////
  // DISPLAY

  // Choose and return the action button to display
  const DisplayedActions = (account: Account, kami: Kami, node: Node) => {
    if (!isVisible) return <></>;
    let buttons = [];

    let useIcon = isDead(kami) ? ReviveIcon : FeedIcon;
    buttons.push(UseItemButton(kami, account, useIcon));
    if (!isDead(kami)) buttons.push(HarvestButton(account, kami, node));
    return buttons;
  };

  return (
    <Container isVisible={isVisible}>
      {displayedKamis.map((kami) => (
        <KamiCard
          key={kami.entity}
          kami={kami}
          actions={DisplayedActions(account, kami, node)}
          content={<StatusDisplay kami={kami} tick={tick} />}
          label={getSubtext(kami)}
          show={{
            battery: true,
            levelUp: true,
            skillPoints: true,
            cooldown: true,
          }}
          utils={utils}
          tick={tick}
        />
      ))}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column nowrap;
  gap: 0.45vw;
  padding: 0.6vw;
`;
