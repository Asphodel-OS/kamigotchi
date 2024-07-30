import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconButton, KamiCard, Tooltip } from 'app/components/library';
import { FeedButton } from 'app/components/library/actions';
import { useSelected, useVisibility } from 'app/stores';
import { reviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Inventory } from 'network/shapes/Item';
import {
  Kami,
  calcHealth,
  calcOutput,
  isDead,
  isHarvesting,
  isOffWorld,
  isResting,
  isUnrevealed,
  onCooldown,
} from 'network/shapes/Kami';
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
    const foods = account.inventories?.filter((inv) => inv?.item.type === 'FOOD');
    if (!foods || foods.length == 0) return false;
    const total = foods.reduce((tot: number, inv: Inventory) => tot + (inv.balance || 0), 0);
    return total > 0;
  };

  const hasRevive = (account: Account): boolean => {
    const revives = account.inventories?.filter((inv) => inv?.item.type === 'REVIVE');
    if (!revives || revives.length == 0) return false;
    const total = revives.reduce((tot: number, inv: Inventory) => tot + (inv.balance || 0), 0);
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
          `${harvestRate} MUSU/hr`,
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
    if (nodeIndex !== index) setNode(index);
    if (!modals.node) setModals({ ...modals, node: true });
    else if (nodeIndex == index) setModals({ ...modals, node: false });
    playClick();
  };

  // returns the onClick function for the description
  const getDescriptionOnClick = (kami: Kami) => {
    if (isHarvesting(kami)) return () => selectNode(kami.production?.node?.index!);
  };

  /////////////////
  // DISPLAY

  // Revive Button display evaluation
  const ReviveButton = (kami: Kami, account: Account) => {
    let tooltipText = 'Revive your Kami';
    if (!hasRevive(account)) tooltipText = 'no revives in inventory';
    else if (onCooldown(kami)) tooltipText = 'on cooldown';

    const stockedInventories =
      account.inventories?.filter((inv: Inventory) => inv.item.type === 'REVIVE') ?? [];
    const reviveIndex = stockedInventories.length > 0 ? stockedInventories[0].item.index : 110;

    return (
      <Tooltip text={[tooltipText]}>
        <IconButton
          img={reviveIcon}
          onClick={() => actions.feed(kami, reviveIndex)}
          disabled={!hasRevive(account) || onCooldown(kami)}
          noMargin
        />
      </Tooltip>
    );
  };

  // Choose and return the action button to display
  const DisplayedAction = (kami: Kami, account: Account) => {
    if (isResting(kami)) return FeedButton(kami, account, actions.feed);
    if (isHarvesting(kami)) return FeedButton(kami, account, actions.feed);
    if (isDead(kami)) return ReviveButton(kami, account);
  };

  // Rendering of Individual Kami Cards in the Party Modal
  // TODO: consider ideal ordering here
  const KamiCards = (kamis: Kami[]) => {
    let myKamis = [...kamis];
    return (
      <>
        {myKamis.reverse().map((kami) => {
          return (
            <KamiCard
              key={kami.entityIndex}
              kami={kami}
              description={getDescription(kami)}
              descriptionOnClick={getDescriptionOnClick(kami)}
              subtext={`${calcOutput(kami)} MUSU`}
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
