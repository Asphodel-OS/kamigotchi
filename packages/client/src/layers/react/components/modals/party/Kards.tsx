import { useEffect, useState } from "react";
import styled from "styled-components";

import { feedIcon, reviveIcon } from "assets/images/icons/actions";
import { ActionButton } from "layers/react/components/library/ActionButton";
import { IconButton } from "layers/react/components/library/IconButton";
import { IconListButton } from "layers/react/components/library/IconListButton";
import { KamiCard } from "layers/react/components/library/KamiCard";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/react/shapes/Account";
import { Inventory } from "layers/react/shapes/Inventory";
import {
  Kami,
  isDead,
  isHarvesting,
  isResting,
  isUnrevealed,
  isOffWorld,
  onCooldown,
  getLocation,
  calcHealth,
  isFull,
  calcOutput,
} from "layers/react/shapes/Kami";
import { getRateDisplay } from 'utils/rates';



interface Props {
  account: Account;
  actions: {
    reveal: (kami: Kami) => void;
    feed: (kami: Kami, foodIndex: number) => void;
    revive: (kami: Kami, reviveIndex: number) => void;
  }
  kamis: Kami[];
}

export const Kards = (props: Props) => {
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

  const hasFood = (): boolean => {
    let inventories = props.account.inventories;
    if (!inventories || !inventories.food) return false;

    const total = inventories.food.reduce(
      (tot: number, inv: Inventory) => tot + (inv.balance || 0),
      0
    );
    return total > 0;
  };

  const hasRevive = (): boolean => {
    let inventories = props.account.inventories;
    if (!inventories || !inventories.revives) return false;

    const total = inventories.revives.reduce(
      (tot: number, inv: Inventory) => tot + (inv.balance || 0),
      0
    );
    return total > 0;
  };

  // get the reason why a kami can't feed.
  // assume the kami is either resting or harvesting
  const whyCantFeed = (kami: Kami): string => {
    let reason = '';
    if (getLocation(kami) != props.account.location) {
      reason = `not at your location`;
    } else if (isFull(kami)) {
      reason = `can't eat, full`;
    } else if (!hasFood()) {
      reason = `buy food, poore`;
    } else if (onCooldown(kami)) {
      reason = `can't eat, on cooldown`;
    }
    return reason;
  };

  const canFeed = (kami: Kami): boolean => {
    return !whyCantFeed(kami);
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
  const FeedButton = (kami: Kami) => {
    const canFeedKami = canFeed(kami);
    const tooltipText = whyCantFeed(kami);
    const canHeal = (inv: Inventory) => !isFull(kami) || inv.item.stats?.health! == 0;

    const stockedInventory = props.account.inventories?.food?.filter(
      (inv: Inventory) => inv.balance && inv.balance > 0
    ) ?? [];

    const feedOptions = stockedInventory.map((inv: Inventory) => {
      return {
        text: `${inv.item.name!} ${!canHeal(inv) ? ' [Kami full]' : ''}`,
        onClick: () => props.actions.feed(kami, inv.item.familyIndex || 1),
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

  // Reveal Button display evaluation
  const RevealButton = (kami: Kami) => (
    <ActionButton
      id={`reveal-kami`}
      text='Reveal'
      onClick={() => props.actions.reveal(kami)}
    />
  );

  // Revive Button display evaluation
  const ReviveButton = (kami: Kami) => {
    let tooltipText = 'Revive your Kami';
    if (!hasRevive()) tooltipText = 'no revives in inventory';
    else if (getLocation(kami) != props.account.location) tooltipText = `not at your location`;
    else if (onCooldown(kami)) tooltipText = 'on cooldown';

    return (
      <Tooltip text={[tooltipText]}>
        <IconButton
          id={`revive-kami`}
          img={reviveIcon}
          onClick={() => props.actions.revive(kami, 1)}
          disabled={!hasRevive() || onCooldown(kami)}
        />
      </Tooltip>
    );
  };

  // Choose and return the action button to display
  const DisplayedAction = (kami: Kami) => {
    if (isUnrevealed(kami)) return RevealButton(kami);
    if (isResting(kami)) return FeedButton(kami);
    if (isHarvesting(kami)) return FeedButton(kami);
    if (isDead(kami)) return ReviveButton(kami);
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
          action={DisplayedAction(kami)}
          battery
          cooldown
        />
      );
    })}
    </>;
  };

  ///////////////////
  // EMPTY TEXT

  if (props.kamis.length === 0) {
    return (
      <EmptyText>
        You have no kamis. Get some.
      </EmptyText>
    );
  }

  return KamiCards(props.kamis);
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