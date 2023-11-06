import { useEffect, useState } from "react";
import cdf from '@stdlib/stats-base-dists-normal-cdf';

import {
  collectIcon,
  feedIcon,
  liquidateIcon,
  stopIcon,
} from "assets/images/icons/actions";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { IconButton } from "layers/react/components/library/IconButton";
import { IconListButton } from "layers/react/components/library/IconListButton";
import { KamiCard } from "layers/react/components/library/KamiCard";
import { Account } from "layers/react/shapes/Account";
import { Inventory } from "layers/react/shapes/Inventory";
import { Kami } from "layers/react/shapes/Kami";
import { LiquidationConfig } from "layers/react/shapes/LiquidationConfig";


interface Props {
  account: Account;
  actions: {
    collect: (kami: Kami) => void;
    feed: (kami: Kami, foodIndex: number) => void;
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  allies: Kami[];
  enemies: Kami[];
  liquidationConfig: LiquidationConfig;
  tab: string;
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

  // calculate the time a kami has spent idle (in seconds)
  const calcIdleTime = (kami: Kami): number => {
    return lastRefresh / 1000 - kami.lastUpdated;
  };

  // calculate the time a production has been active since its last update
  const calcProductionTime = (kami: Kami): number => {
    let productionTime = 0;
    if (isHarvesting(kami) && kami.production) {
      productionTime = lastRefresh / 1000 - kami.production.startTime;
    }
    return productionTime;
  }

  // calculate health based on the drain against last confirmed health
  const calcHealth = (kami: Kami): number => {
    let health = 1 * kami.health;
    let duration = calcProductionTime(kami);
    health += kami.healthRate * duration;
    health = Math.min(Math.max(health, 0), kami.stats.health);
    return health;
  };

  // calculate the expected output from a pet production based on starttime
  const calcOutput = (kami: Kami): number => {
    let output = 0;
    if (isHarvesting(kami) && kami.production) {
      output = kami.production.balance;
      let duration = calcProductionTime(kami);
      output += Math.floor(duration * kami.production?.rate);
    }
    return Math.max(output, 0);
  };

  // calculate the affinity multiplier for liquidation threshold
  const calcLiquidationAffinityMultiplier = (attacker: Kami, victim: Kami): number => {
    const multiplierBase = props.liquidationConfig.multipliers.affinity.base;
    const multiplierUp = props.liquidationConfig.multipliers.affinity.up;
    const multiplierDown = props.liquidationConfig.multipliers.affinity.down;

    let multiplier = multiplierBase;
    if (attacker.traits && victim.traits) {
      const attackerAffinity = attacker.traits.hand.affinity;
      const victimAffinity = victim.traits.body.affinity;
      if (attackerAffinity === 'EERIE') {
        if (victimAffinity === 'SCRAP') multiplier = multiplierUp;
        else if (victimAffinity === 'INSECT') multiplier = multiplierDown;
      } else if (attackerAffinity === 'SCRAP') {
        if (victimAffinity === 'INSECT') multiplier = multiplierUp;
        else if (victimAffinity === 'EERIE') multiplier = multiplierDown;
      } else if (attackerAffinity === 'INSECT') {
        if (victimAffinity === 'EERIE') multiplier = multiplierUp;
        else if (victimAffinity === 'SCRAP') multiplier = multiplierDown;
      }
    }
    return multiplier;
  };

  // calculate the base liquidation threshold b/w two kamis as a %
  const calcLiquidationThresholdBase = (attacker: Kami, victim: Kami): number => {
    const attackerTotalViolence = attacker.stats.violence + attacker.bonusStats.violence;
    const victimTotalHarmony = victim.stats.harmony + victim.bonusStats.harmony;
    const ratio = attackerTotalViolence / victimTotalHarmony;
    const weight = cdf(Math.log(ratio), 0, 1);
    const peakBaseThreshold = props.liquidationConfig.threshold;
    return weight * peakBaseThreshold;
  };

  // calculate the liquidation threshold b/w two kamis as a %
  const calcLiquidationThreshold = (attacker: Kami, victim: Kami): number => {
    const base = calcLiquidationThresholdBase(attacker, victim);
    const multiplier = calcLiquidationAffinityMultiplier(attacker, victim);
    return base * multiplier;
  };

  const calcLiquidationThresholdValue = (attacker: Kami, victim: Kami): number => {
    const victimTotalHealth = victim.stats.health + victim.bonusStats.health;
    const thresholdPercent = calcLiquidationThreshold(attacker, victim);
    return thresholdPercent * victimTotalHealth;
  }


  const isFull = (kami: Kami): boolean => {
    return Math.round(calcHealth(kami)) >= kami.stats.health;
  };

  const hasFood = (): boolean => {
    const total = props.account.inventories!.food!.reduce(
      (tot: number, inv: Inventory) => tot + (inv.balance || 0),
      0
    );
    return total > 0;
  };

  // get the reason why a kami can't feed. assume the kami is either resting or harvesting
  const whyCantFeed = (kami: Kami): string => {
    let reason = '';
    if (kami.production?.node?.location != props.account.location) {
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

  const canMog = (attacker: Kami, victim: Kami): boolean => {
    const thresholdPercent = calcLiquidationThreshold(attacker, victim);
    const victimTotalHealth = victim.stats.health + victim.bonusStats.health;
    const absoluteThreshold = thresholdPercent * victimTotalHealth;
    return calcHealth(victim) < absoluteThreshold;
  }
  // determine whether a kami can liquidate another kami
  const canLiquidate = (attacker: Kami, victim: Kami): boolean => {
    return !onCooldown(attacker) && isHealthy(attacker) && canMog(attacker, victim);
  }

  // check whether the kami is currently harvesting
  // TODO: replace this with a general state check
  const isHarvesting = (kami: Kami): boolean => {
    let result = false;
    if (kami.production) {
      result = kami.production.state === 'ACTIVE';
    }
    return result;
  };

  // determine if pet is healthy (currHealth > 0)
  const isHealthy = (kami: Kami): boolean => {
    return calcHealth(kami) > 0;
  };

  // determine whether the kami is still on cooldown
  const onCooldown = (kami: Kami): boolean => {
    return calcIdleTime(kami) < kami.cooldown;
  };

  // get the description on the card
  const getDescription = (kami: Kami): string[] => {
    const health = calcHealth(kami);
    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats.health + kami.bonusStats.health}`,
      `Harmony: ${kami.stats.harmony + kami.bonusStats.harmony}`,
      `Violence: ${kami.stats.violence + kami.bonusStats.violence}`,
    ];
    return description;
  }

  // evaluate tooltip for allied kami Collect button
  const getCollectTooltip = (kami: Kami): string => {
    let text = getDisabledReason(kami);
    if (text === '') text = 'Collect Harvest';
    return text;
  }

  // evaluate tooltip for allied kami Stop button
  const getStopTooltip = (kami: Kami): string => {
    let text = getDisabledReason(kami);
    if (text === '') text = 'Stop Harvest';
    return text;
  }

  // derive general disabled reason for allied kami
  const getDisabledReason = (kami: Kami): string => {
    let reason = '';
    if (onCooldown(kami)) {
      const cooldown = kami.cooldown - calcIdleTime(kami)
      reason = 'On cooldown (' + cooldown.toFixed(0) + 's left)';
    } else if (!isHealthy(kami)) {
      reason = 'starving :(';
    }
    return reason;
  }

  const getLiquidateTooltip = (target: Kami, allies: Kami[]): string => {
    let reason = '';
    let available = [...allies];
    if (available.length == 0) {
      reason = 'your kamis aren\'t on this node';
    }

    available = available.filter((kami) => isHealthy(kami));
    if (available.length == 0 && reason === '') {
      reason = 'your kamis are starving';
    }

    available = available.filter((kami) => !onCooldown(kami));
    if (available.length == 0 && reason === '') {
      reason = 'your kamis are on cooldown';
    }

    // check what the liquidation threshold is for any kamis that have made it to 
    const valid = available.filter((kami) => canMog(kami, target));
    if (valid.length == 0 && reason === '') {
      // get the details of the highest cap liquidation
      const thresholds = available.map((ally) => calcLiquidationThresholdValue(ally, target));
      const [threshold, index] = thresholds.reduce(
        (a, b, i) => a[0] < b ? [b, i] : a,
        [Number.MIN_VALUE, -1]
      );
      const champion = available[index];
      reason = `${champion.name} can liquidate at ${Math.round(threshold)} Health`;
    }

    if (reason === '') reason = 'Liquidate this Kami';
    return reason;
  }


  ///////////////////
  // DISPLAY (buttons)


  // button for collecting on production
  const CollectButton = (kami: Kami) => {
    return (
      <Tooltip key='collect-tooltip' text={[getCollectTooltip(kami)]}>
        <IconButton
          id={`harvest-collect-${kami.index}`}
          onClick={() => props.actions.collect(kami)}
          img={collectIcon}
          disabled={kami.production === undefined || getDisabledReason(kami) !== ''}
        />
      </Tooltip>
    );
  }

  const FeedButton = (kami: Kami) => {
    const canFeedKami = canFeed(kami);
    const tooltipText = whyCantFeed(kami);

    const stockedInventory = props.account.inventories?.food?.filter(
      (inv: Inventory) => inv.balance && inv.balance > 0
    ) ?? [];

    const feedOptions = stockedInventory.map((inv: Inventory) => {
      return {
        text: inv.item.name!,
        onClick: () => props.actions.feed(kami, inv.item.familyIndex || 1),
      };
    });

    let returnVal = (
      <IconListButton
        id={`feed-button-${kami.index}`}
        img={feedIcon}
        disabled={!canFeedKami}
        options={feedOptions}
      />
    );
    if (!canFeedKami) returnVal = <Tooltip text={[tooltipText]}>{returnVal}</Tooltip>;

    return returnVal;
  };

  // button for stopping production
  const StopButton = (kami: Kami) => {
    return (
      <Tooltip key='stop-tooltip' text={[getStopTooltip(kami)]}>
        <IconButton
          id={`harvest-stop-${kami.index}`}
          img={stopIcon}
          onClick={() => props.actions.stop(kami)}
          disabled={kami.production === undefined || getDisabledReason(kami) !== ''}
        />
      </Tooltip >
    );
  }

  // button for liquidating production
  const LiquidateButton = (target: Kami, allies: Kami[]) => {
    const options = allies.filter((ally) => canLiquidate(ally, target));
    const actionOptions = options.map((myKami) => {
      return {
        text: `${myKami.name}`,
        onClick: () => props.actions.liquidate(myKami, target)
      };
    });

    let tooltipText = getLiquidateTooltip(target, allies);
    return (
      <Tooltip key='liquidate-tooltip' text={[tooltipText]}>
        <IconListButton
          id={`liquidate-button-${target.index}`}
          key={`harvest-liquidate`}
          img={liquidateIcon}
          options={actionOptions}
          disabled={actionOptions.length == 0}
        />
      </Tooltip >
    );
  };


  ///////////////////
  // DISPLAY (kards)

  // rendering of an ally kami on this node
  const MyKard = (kami: Kami) => {
    const output = calcOutput(kami);

    return (
      <KamiCard
        key={kami.entityIndex}
        kami={kami}
        description={getDescription(kami)}
        subtext={`yours (\$${output})`}
        action={[FeedButton(kami), CollectButton(kami), StopButton(kami)]}
        battery
        cooldown
      />
    );
  };

  // rendering of an enemy kami on this node
  const EnemyKard = (kami: Kami, myKamis: Kami[]) => {
    return (
      <KamiCard
        key={kami.entityIndex}
        kami={kami}
        subtext={`${kami.account!.name} (\$${calcOutput(kami)})`}
        action={LiquidateButton(kami, myKamis)}
        description={getDescription(kami)}
        battery
        cooldown
      />
    );
  };

  return (
    <>
      {(props.tab === 'allies')
        ? props.allies.map((ally: Kami) => MyKard(ally))
        : props.enemies.map((enemy: Kami) => EnemyKard(enemy, props.allies))
      }
    </>
  );
}