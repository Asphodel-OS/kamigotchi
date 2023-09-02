import { useEffect, useState } from "react";

import { ActionButton } from "layers/react/components/library/ActionButton";
import { ActionListButton } from "layers/react/components/library/ActionListButton";
import { KamiCard } from "layers/react/components/library/KamiCard";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/react/shapes/Account";
import { Inventory } from "layers/react/shapes/Inventory";
import { Kami } from "layers/react/shapes/Kami";


interface Props {
  kamis: Kami[];
  account: Account;
  actions: {
    reveal: Function;
    feed: Function;
    revive: Function;
  }
}

export const Kards = (props: Props) => {
  // ticking
  const [lastRefresh, setLastRefresh] = useState(Date.now());
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

  // calculate health based on the drain against last confirmed health
  const calcHealth = (kami: Kami): number => {
    let health = 1 * kami.health;
    let duration = calcIdleTime(kami);
    health += kami.healthRate * duration;
    health = Math.min(Math.max(health, 0), kami.stats.health);
    return health;
  };

  // calculate the time a kami has spent idle (in seconds)
  const calcIdleTime = (kami: Kami): number => {
    return lastRefresh / 1000 - kami.lastUpdated;
  };

  // converts a per-second rate to a per-hour rate string with a given precision
  const getRateDisplay = (rate: number | undefined, roundTo: number): string => {
    if (rate === undefined) rate = 0;
    let hourlyRate = rate * 3600;
    let display = hourlyRate.toString();
    if (roundTo) {
      hourlyRate *= 10 ** roundTo;
      hourlyRate = Math.round(hourlyRate);
      hourlyRate /= 10 ** roundTo;
      display = hourlyRate.toFixed(roundTo);
    }
    if (hourlyRate > 0) display = '+' + display;
    return display;
  };

  // calculate the expected output from a pet production based on starttime
  const calcOutput = (kami: Kami): number => {
    let output = 0;
    if (isHarvesting(kami) && kami.production) {
      output = kami.production.balance * 1;
      let duration = lastRefresh / 1000 - kami.production.startTime;
      output += Math.floor(duration * kami.production?.rate);
    }
    return Math.max(output, 0);
  };

  // interpret the location of the kami based on the kami's state
  const getLocation = (kami: Kami): number => {
    let location = 0;
    if (!isHarvesting(kami)) location = props.account.location;
    else if (kami.production && kami.production.node) {
      location = kami.production.node.location;
    }
    return location;
  };

  const isFull = (kami: Kami): boolean => {
    return Math.round(calcHealth(kami)) >= kami.stats.health;
  };

  const hasFood = (): boolean => {
    return props.account.inventories!.food.length > 0;
  };

  const hasRevive = (): boolean => {
    return props.account.inventories!.revives.length > 0;
  };

  // determine whether the kami is still on cooldown
  const onCooldown = (kami: Kami): boolean => {
    return kami.cooldown > calcIdleTime(kami);
  }

  // get the reason why a kami can't feed. assume the kami is either resting or harvesting
  const whyCantFeed = (kami: Kami): string => {
    let reason = '';
    if (getLocation(kami) != props.account.location) {
      reason = `not at your location`;
    } else if (isFull(kami)) {
      reason = `already full`;
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

  // naive check right now, needs to be updated with murder check as well
  const isDead = (kami: Kami): boolean => {
    return kami.state === 'DEAD';
  };

  // check whether the kami is harvesting
  const isHarvesting = (kami: Kami): boolean =>
    kami.state === 'HARVESTING' && kami.production != undefined;

  // check whether the kami is resting
  const isResting = (kami: Kami): boolean => {
    return kami.state === 'RESTING';
  };

  // check whether the kami is revealed
  const isUnrevealed = (kami: Kami): boolean => {
    return kami.state === 'UNREVEALED';
  };

  // check whether the kami is captured by slave traders
  const isOffWorld = (kami: Kami): boolean => {
    return kami.state === '721_EXTERNAL';
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
        description.push(`by ${kami.deaths[0]!.source!.name}`);
        description.push(`on ${kami.deaths[0]!.node.name} `);
      }
    } else if (isHarvesting(kami)) {
      if (calcHealth(kami) == 0) {
        description = [`Starving.. `, `on ${kami.production!.node?.name}`];
      } else if (kami.production?.node != undefined) {
        const harvestRate = getRateDisplay(kami.production?.rate, 2);
        description = [
          `Harvesting`,
          `on ${kami.production!.node!.name}`,
          `${harvestRate} $MUSU/hr`,
          `${healthRate} HP/hr`,
        ];
      }
    }
    return description;
  };


  /////////////////
  // DISPLAY

  const FeedButton = (kami: Kami) => {
    const canFeedKami = canFeed(kami);
    const tooltipText = whyCantFeed(kami);

    const stockedInventory = props.account.inventories!.food.filter(
      (inv: Inventory) => inv.balance && inv.balance > 0
    );

    const feedOptions = stockedInventory.map((inv: Inventory) => {
      return {
        text: inv.item.name,
        onClick: () => props.actions.feed(kami, inv.item.familyIndex),
      };
    });

    let returnVal = (
      <ActionListButton
        id={`feedKami-button-${kami.index}`}
        text='Feed'
        disabled={!canFeedKami}
        options={feedOptions}
      />
    );
    if (!canFeedKami) returnVal = <Tooltip text={[tooltipText]}>{returnVal}</Tooltip>;

    return returnVal;
  };

  const RevealButton = (kami: Kami) => (
    <ActionButton
      id={`reveal-kami`}
      text='Reveal'
      onClick={() => props.actions.reveal(kami)}
    />
  );

  const ReviveButton = (kami: Kami) => (
    <ActionButton
      id={`revive-kami`}
      text='Revive'
      onClick={() => props.actions.revive(kami, 1)}
      disabled={!hasRevive() || onCooldown(kami)}
    />
  );

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

  return KamiCards(props.kamis);
}