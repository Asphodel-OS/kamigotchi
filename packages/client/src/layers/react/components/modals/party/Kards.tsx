import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { feedIcon, reviveIcon } from 'assets/images/icons/actions';
import { Account } from 'layers/network/shapes/Account';
import { Inventory } from 'layers/network/shapes/Inventory';
import {
  Kami,
  calcHealth,
  calcOutput,
  isDead,
  isFull,
  isHarvesting,
  isOffWorld,
  isResting,
  isUnrevealed,
  onCooldown,
} from 'layers/network/shapes/Kami';
import { IconButton } from 'layers/react/components/library/IconButton';
import { IconListButton } from 'layers/react/components/library/IconListButton';
import { KamiCard } from 'layers/react/components/library/KamiCard';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { useSelected } from 'layers/react/store/selected';
import { useVisibility } from 'layers/react/store/visibility';
import { getRateDisplay } from 'utils/rates';
import { playClick } from 'utils/sounds';

interface Props {
  account: Account;
  actions: {
    feed: (kami: Kami, itemIndex: number) => void;
    revive: (kami: Kami, reviveIndex: number) => void;
  };
  kamis: Kami[];
}

export const Kards = (props: Props) => {
  const { actions, account, kamis } = props;
  const { modals, setModals } = useVisibility();
  const { nodeIndex, setNode } = useSelected();

  // ticking
  const [_, setLastRefresh] = useState(Date.now());
  useEffect(() => {
    const refreshClock = () => {
      setLastRefresh(Date.now());
    };
    const timerId = setInterval(refreshClock, 1000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  /////////////////
  // INTERPRETATION

  const hasFood = (account: Account): boolean => {
    let inventories = account.inventories;
    if (!inventories || !inventories.food) return false;

    const total = inventories.food.reduce(
      (tot: number, inv: Inventory) => tot + (inv.balance || 0),
      0
    );
    return total > 0;
  };

  const hasRevive = (account: Account): boolean => {
    let inventories = account.inventories;
    if (!inventories || !inventories.revives) return false;

    const total = inventories.revives.reduce(
      (tot: number, inv: Inventory) => tot + (inv.balance || 0),
      0
    );
    return total > 0;
  };

  // get the description of the kami as a list of lines
  // TODO: clean this up
  const getDescription = (kami: Kami): string[] => {
    const healthRate = getRateDisplay(kami.stats.health.rate, 2);

    let description: string[] = [];
    if (isOffWorld(kami)) {
      description = ['kidnapped by slave traders'];
    } else if (isUnrevealed(kami)) {
      description = ['Unrevealed!'];
    } else if (isResting(kami)) {
      description = ['Resting', `${healthRate} HP/hr`];
    } else if (isDead(kami)) {
      description = [`Murdered`];
      if (kami.deaths && kami.deaths.length > 0) {
        description.push(`by ${kami.deaths[0].source!.name}`);
        description.push(`on ${kami.deaths[0].node.name} `);
      }
    } else if (isHarvesting(kami) && kami.production) {
      if (calcHealth(kami) == 0) {
        description = [`Starving.. `, `on ${kami.production.node?.name}`];
      } else if (kami.production.node != undefined) {
        const harvestRate = getRateDisplay(kami.production.rate, 2);
        description = [
          `Harvesting`,
          `on ${kami.production.node.name}`,
          `${harvestRate} $MUSU/hr`,
          `${healthRate} HP/hr`,
        ];
      }
    }
    return description;
  };

  /////////////////
  // INTERACTION

  // toggle the node modal to the selected one
  const selectNode = (index: number) => {
    if (!modals.node) setModals({ ...modals, node: true });
    if (nodeIndex !== index) setNode(index);
    playClick();
  };

  // returns the onClick function for the description
  const getDescriptionOnClick = (kami: Kami) => {
    if (isHarvesting(kami)) return () => selectNode(kami.production?.node?.index!);
  };

  /////////////////
  // DISPLAY

  // Feed Button display evaluation
  const FeedButton = (kami: Kami, account: Account) => {
    // filter down to available food items
    const stockedInventory =
      account.inventories?.food?.filter((inv: Inventory) => inv.balance && inv.balance > 0) ?? [];
    const canHeal = (inv: Inventory) => !isFull(kami) || inv.item.stats?.health.sync == 0;
    const feedOptions = stockedInventory.map((inv: Inventory) => {
      return {
        text: `${inv.item.name} ${!canHeal(inv) ? ' [Kami full]' : ''}`,
        onClick: () => actions.feed(kami, inv.item.index),
        disabled: !canHeal(inv),
      };
    });

    // check whether the kami can be fed and generate a tooltip for the reason
    let tooltip = 'feed kami';
    if (isHarvesting(kami) && kami.production?.node?.roomIndex != account.roomIndex) {
      tooltip = `not at your roomIndex`;
    } else if (isFull(kami)) {
      tooltip = `can't eat, full`;
    } else if (!hasFood(account)) {
      tooltip = `buy food, poore`;
    } else if (onCooldown(kami)) {
      tooltip = `can't eat, on cooldown`;
    }

    return (
      <Tooltip text={[tooltip]}>
        <IconListButton img={feedIcon} disabled={tooltip !== 'feed kami'} options={feedOptions} />;
      </Tooltip>
    );
  };

  // Revive Button display evaluation
  const ReviveButton = (kami: Kami, account: Account) => {
    let tooltipText = 'Revive your Kami';
    if (!hasRevive(account)) tooltipText = 'no revives in inventory';
    else if (onCooldown(kami)) tooltipText = 'on cooldown';

    return (
      <Tooltip text={[tooltipText]}>
        <IconButton
          img={reviveIcon}
          onClick={() => actions.revive(kami, account.inventories!.revives[0].item.index)}
          disabled={!hasRevive(account) || onCooldown(kami)}
        />
      </Tooltip>
    );
  };

  // Choose and return the action button to display
  const DisplayedAction = (kami: Kami, account: Account) => {
    if (isResting(kami)) return FeedButton(kami, account);
    if (isHarvesting(kami)) return FeedButton(kami, account);
    if (isDead(kami)) return ReviveButton(kami, account);
  };

  // Rendering of Individual Kami Cards in the Party Modal
  // TODO: consider ideal ordering here
  const KamiCards = (kamis: Kami[]) => {
    let myKamis = [...kamis] ?? [];
    return (
      <>
        {myKamis.reverse().map((kami) => {
          return (
            <KamiCard
              key={kami.entityIndex}
              kami={kami}
              description={getDescription(kami)}
              descriptionOnClick={getDescriptionOnClick(kami)}
              subtext={`${calcOutput(kami)} $MUSU`}
              actions={DisplayedAction(kami, account)}
              showBattery
              showCooldown
            />
          );
        })}
      </>
    );
  };

  ///////////////////
  // EMPTY TEXT

  if (kamis.length === 0) {
    return <EmptyText>You have no kamis. Get some.</EmptyText>;
  }

  return KamiCards(kamis);
};

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;
  margin: 3vh;
  height: 100%;
`;
