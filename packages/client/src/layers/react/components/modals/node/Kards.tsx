import { useEffect, useState } from "react";
import cdf from '@stdlib/stats-base-dists-normal-cdf';

import {
  ActionListButton,
  Option as ActionListOption
} from "layers/react/components/library/ActionListButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { IconButton } from "layers/react/components/library/IconButton";
import { IconListButton } from "layers/react/components/library/IconListButton";
import { KamiCard } from "layers/react/components/library/KamiCard";
import { Kami } from "layers/react/shapes/Kami";
import { LiquidationConfig } from "layers/react/shapes/LiquidationConfig";
import {
  collectIcon,
  feedIcon,
  liquidateIcon,
  stopIcon,
} from "assets/images/icons/actions";



interface Props {
  allies: Kami[];
  enemies: Kami[];
  actions: {
    collect: (kami: Kami) => void;
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  liquidationConfig: LiquidationConfig;
  tab: string;
}

export const Kards = (props: Props) => {
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // ticking
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

    available = available.filter((kami) => canMog(kami, target));
    if (available.length == 0 && reason === '') {
      reason = 'your kamis could be more violent';
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
    const actionOptions: ActionListOption[] = options.map((myKami) => {
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
        action={[CollectButton(kami), StopButton(kami)]}
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