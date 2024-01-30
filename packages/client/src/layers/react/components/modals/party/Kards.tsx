import { useEffect, useState } from "react";
import styled from "styled-components";

import { feedIcon, reviveIcon } from "assets/images/icons/actions";
import { ActionButton } from "layers/react/components/library/ActionButton";
import { IconButton } from "layers/react/components/library/IconButton";
import { IconListButton } from "layers/react/components/library/IconListButton";
import { KamiCard } from "layers/react/components/library/KamiCard";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/network/shapes/Account";
import { Inventory } from "layers/network/shapes/Inventory";
import {
  Kami,
  isDead,
  isHarvesting,
  isResting,
  isUnrevealed,
  isOffWorld,
  onCooldown,
  calcHealth,
  isFull,
  calcOutput,
} from "layers/network/shapes/Kami";
import { getRateDisplay } from 'utils/rates';
import { playClick } from "utils/sounds";

interface Props {
  account: Account;
  actions: {
    feed: (kami: Kami, foodIndex: number) => void;
    revive: (kami: Kami, reviveIndex: number) => void;
  }
  kamis: Kami[];
}

export const Kards = (props: Props) => {
  const { actions, account, kamis } = props;

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

  // get the reason why a kami can't feed.
  // assume the kami is either resting or harvesting
  const whyCantFeed = (kami: Kami, account: Account): string => {
    let reason = '';
    if (isHarvesting(kami) && kami.production?.node?.location != account.location) {
      reason = `not at your location`;
    } else if (isFull(kami)) {
      reason = `can't eat, full`;
    } else if (!hasFood(account)) {
      reason = `buy food, poore`;
    } else if (onCooldown(kami)) {
      reason = `can't eat, on cooldown`;
    }
    return reason;
  };

  const canFeed = (kami: Kami, account: Account): boolean => {
    return !whyCantFeed(kami, account);
  };

  // get the description of the kami as a list of lines
  // TODO: clean this up
  const getDescription = (kami: Kami): string[] => {
    const healthRate = getRateDisplay(kami.healthRate, 2);

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
  // DISPLAY

  // Feed Button display evaluation
  const FeedButton = (kami: Kami, account: Account) => {
    const canFeedKami = canFeed(kami, account);
    const tooltipText = whyCantFeed(kami, account);
    const canHeal = (inv: Inventory) => !isFull(kami) || inv.item.stats?.health! == 0;

    const stockedInventory = account.inventories?.food?.filter(
      (inv: Inventory) => inv.balance && inv.balance > 0
    ) ?? [];

    const feedOptions = stockedInventory.map((inv: Inventory) => {
      return {
        text: `${inv.item.name!} ${!canHeal(inv) ? ' [Kami full]' : ''}`,
        onClick: () => actions.feed(kami, inv.item.familyIndex || 1),
        disabled: !canHeal(inv)
      };
    });

    let returnVal = (
      <IconListButton
        id={`feedKami-button-${kami.index}`}
        img={feedIcon}
        disabled={!canFeedKami}
        options={feedOptions}
      />
    );
    if (!canFeedKami) returnVal = <Tooltip text={[tooltipText]}>{returnVal}</Tooltip>;

    return returnVal;
  };

  // Revive Button display evaluation
  const ReviveButton = (kami: Kami, account: Account) => {
    let tooltipText = 'Revive your Kami';
    if (!hasRevive(account)) tooltipText = 'no revives in inventory';
    else if (onCooldown(kami)) tooltipText = 'on cooldown';

    return (
      <Tooltip text={[tooltipText]}>
        <IconButton
          id={`revive-kami`}
          img={reviveIcon}
          onClick={() => actions.revive(kami, 1)}
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
    return <>{myKamis.reverse().map((kami) => {
      return (
        <KamiCard
          key={kami.entityIndex}
          kami={kami}
          description={getDescription(kami)}
          subtext={`${calcOutput(kami)} $MUSU`}
          actions={DisplayedAction(kami, account)}
          showBattery
          showCooldown
        />
      );
    })}
    </>;
  };

  ///////////////////
  // EMPTY TEXT

  if (kamis.length === 0) {
    return (
      <EmptyText>
        You have no kamis. Get some.
      </EmptyText>
    );
  }

  return KamiCards(kamis);
}

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;
  margin: 3vh;
  height: 100%;
`;