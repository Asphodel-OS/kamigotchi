import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getHarvestItem } from 'app/cache/harvest';
import {
  calcCooldown,
  calcHealth,
  calcOutput,
  isDead,
  isHarvesting,
  isOffWorld,
  isResting,
  isUnrevealed,
  KamiRefreshOptions,
} from 'app/cache/kami';
import { compareTraits } from 'app/cache/trait';
import { EmptyText, IconListButton, KamiCard } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { FeedIcon, ReviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Node, NullNode } from 'network/shapes/Node';
import { getRateDisplay } from 'utils/numbers';
import { playClick } from 'utils/sounds';
import { SortIcons } from './constants';
import { Sort } from './types';

interface Props {
  data: {
    account: Account;
    kamis: Kami[];
    node: Node;
  };
  display: {
    HarvestButton: (account: Account, kami: Kami, node: Node) => JSX.Element;
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
  };
  utils: {
    getAccount: () => Account;
    getKamis: (options?: KamiRefreshOptions) => Kami[];
    getNode: (index: number) => Node;
  };
}

export const Kards = (props: Props) => {
  const { data, display } = props;
  const { account, kamis, node } = data;
  const { HarvestButton, UseItemButton } = display;
  const { modals, setModals } = useVisibility();
  const { nodeIndex, setNode: setSelectedNode } = useSelected(); // node selected by user
  const [displayedKamis, setDisplayedKamis] = useState<Kami[]>(kamis);

  const [sort, setSort] = useState<Sort>('index');

  // sort kamis when sort is changed
  // sorts in place so the seDisplayedKamis is just to triggere an update
  useEffect(() => {
    let sorted = kamis;
    if (sort === 'index') {
      sorted = kamis.sort((a, b) => a.index - b.index);
    } else if (sort === 'name') {
      sorted = kamis.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'health') {
      sorted = kamis.sort((a, b) => calcHealth(a) - calcHealth(b));
    } else if (sort === 'cooldown') {
      sorted = kamis.sort((a, b) => calcCooldown(a) - calcCooldown(b));
    } else if (sort === 'body') {
      sorted = kamis.sort((a, b) => compareTraits(a.traits?.body!, b.traits?.body!));
    } else if (sort === 'hands') {
      sorted = kamis.sort((a, b) => compareTraits(a.traits?.hand!, b.traits?.hand!));
    }

    setDisplayedKamis(kamis);
  }, [modals.party, sort]);

  // memoized sort options
  const sortOptions = useMemo(
    () =>
      Object.entries(SortIcons).map(([key, image]) => ({
        text: key,
        image,
        onClick: () => setSort(key as Sort),
      })),
    []
  );

  /////////////////
  // INTERPRETATION

  // get the description of the kami as a list of lines
  // TODO: clean this up. might be overeager on harvest rate calcs
  const getDescription = (kami: Kami): string[] => {
    const healthRate = getRateDisplay(kami.stats!.health.rate, 2);

    let description: string[] = [];
    if (isOffWorld(kami)) description = ['kidnapped by slave traders'];
    else if (isUnrevealed(kami)) description = ['Unrevealed!'];
    else if (isResting(kami)) description = ['Resting', `${healthRate} HP/hr`];
    else if (isDead(kami)) description = [`Murdered`];
    else if (isHarvesting(kami) && kami.harvest) {
      const harvest = kami.harvest;
      const harvestRate = getRateDisplay(harvest.rates.total.spot, 2);
      const item = getHarvestItem(harvest);
      const node = harvest.node ?? NullNode;

      if (calcHealth(kami) == 0) {
        description = [`Starving.. `, `on ${node.name}`];
      } else {
        description = [
          `Harvesting`,
          `on ${node.name}`,
          `${harvestRate} ${item.name}/hr`,
          `${healthRate} HP/hr`,
        ];
      }
    }
    return description;
  };

  // get the balance subtext for a kami
  // TODO: update this with iconography
  const getSubtext = (kami: Kami): string => {
    const harvest = kami.harvest;
    if (!harvest || harvest.state != 'ACTIVE') return '';
    const item = getHarvestItem(harvest);
    return `${calcOutput(kami)} ${item.name}`;
  };

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
  // INTERACTION

  // toggle the node modal to the selected one
  const selectNode = (index: number) => {
    if (nodeIndex !== index) setSelectedNode(index);
    if (!modals.node) setModals({ node: true });
    else if (nodeIndex == index) setModals({ node: false });
    playClick();
  };

  // returns the onClick function for the description
  const getDescriptionOnClick = (kami: Kami) => {
    if (isHarvesting(kami)) return () => selectNode(kami.harvest?.node?.index!);
  };

  /////////////////
  // DISPLAY

  // Choose and return the action button to display
  const DisplayedAction = (account: Account, kami: Kami, node: Node) => {
    let buttons = [];
    let useIcon = FeedIcon;
    if (isDead(kami)) useIcon = ReviveIcon;
    else buttons.push(HarvestButton(account, kami, node));
    buttons.push(UseItemButton(kami, account, useIcon));
    return buttons;
  };

  return (
    <Container>
      {kamis.length == 0 && (
        <EmptyText text={['Need Kamis?', 'Some have been seen in the Vending Machine.']} />
      )}
      {kamis.length > 6 && (
        <StickyRow>
          <Text size={1.2}>Whale Tools</Text>
          <IconListButton img={SortIcons[sort]} text={sort} options={sortOptions} radius={0.6} />
        </StickyRow>
      )}
      <KamiContainer>
        {displayedKamis.map((kami) => (
          <KamiCard
            key={kami.entity}
            kami={kami}
            description={getDescription(kami)}
            descriptionOnClick={getDescriptionOnClick(kami)}
            subtext={getSubtext(kami)}
            contentTooltip={getTooltip(kami)}
            actions={DisplayedAction(account, kami, node)}
            showBattery
            showCooldown
          />
        ))}
      </KamiContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const KamiContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 0.45vw;
  padding: 0.6vw;
  padding-top: 0vw;
`;

const StickyRow = styled.div`
  position: sticky;
  z-index: 1;
  top: 0;

  background-color: #eee;
  opacity: 0.9;
  width: 100%;

  padding: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  user-select: none;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
