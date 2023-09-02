import { useEffect, useState } from "react";
import styled from 'styled-components';
import cdf from '@stdlib/stats-base-dists-normal-cdf';

import {
  ActionListButton,
  Option as ActionListOption
} from "layers/react/components/library/ActionListButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { ActionButton } from "layers/react/components/library/ActionButton";
import { KamiCard } from "layers/react/components/library/KamiCard";
import { Kami } from "layers/react/shapes/Kami";
import { LiquidationConfig } from "layers/react/shapes/LiquidationConfig";


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
  // DATA INTERPRETATION

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
    const ratio = attacker.stats.violence / victim.stats.harmony;
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

  // determine if pet is healthy (currHealth > 0)
  const isHealthy = (kami: Kami): boolean => {
    return calcHealth(kami) > 0;
  };

  // determine whether the kami is still on cooldown
  const onCooldown = (kami: Kami): boolean => {
    return calcIdleTime(kami) < kami.cooldown;
  };

  // determine whether a kami can liquidate another kami
  const canLiquidate = (attacker: Kami, victim: Kami): boolean => {
    const thresholdPercent = calcLiquidationThreshold(attacker, victim);
    const absoluteThreshold = thresholdPercent * victim.stats.health;
    const canMog = calcHealth(victim) < absoluteThreshold;
    return !onCooldown(attacker) && isHealthy(attacker) && canMog;
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

  const isResting = (kami: Kami): boolean => {
    return kami.state === 'RESTING';
  };

  ///////////////////
  // DISPLAY

  // derive disabled text for allied kami (return '' if not disabled)
  const getDisabledText = (kami: Kami): string => {
    let disabledText = '';
    if (onCooldown(kami)) {
      const cooldown = kami.cooldown - calcIdleTime(kami)
      disabledText = 'On cooldown (' + cooldown.toFixed(0) + 's left)';
    } else if (!isHealthy(kami)) {
      disabledText = 'Kami is starving!';
    }
    return disabledText;
  }

  // button for collecting on production
  const CollectButton = (kami: Kami) => {
    let tooltipText = getDisabledText(kami);

    return (
      <Tooltip text={[tooltipText]}>
        <ActionButton
          id={`harvest-collect-${kami.index}`}
          key={`harvest-collect-${kami.index}`}
          onClick={() => props.actions.collect(kami)}
          text='Collect'
          disabled={kami.production === undefined || tooltipText !== ''}
        />
      </Tooltip>
    );
  }

  // button for stopping production
  const StopButton = (kami: Kami) => {
    let tooltipText = getDisabledText(kami);
    return (
      <Tooltip text={[tooltipText]}>
        <ActionButton
          id={`harvest-stop-${kami.index}`}
          key={`harvest-stop-${kami.index}`}
          text='Stop'
          onClick={() => props.actions.stop(kami)}
          disabled={kami.production === undefined || tooltipText !== ''}
        />
      </Tooltip >
    );
  }

  // button for liquidating production
  const LiquidateButton = (target: Kami, allies: Kami[]) => {
    const options: ActionListOption[] = allies.map((myKami) => {
      return {
        text: `${myKami.name}`,
        onClick: () => props.actions.liquidate(myKami, target)
      };
    });

    return (
      <ActionListButton
        id={`liquidate-button-${target.index}`}
        key={`harvest-liquidate`}
        text='Liquidate'
        options={options}
        disabled={allies.length == 0}
      />
    );
  };

  // rendering of an ally kami on this node
  const MyKard = (kami: Kami) => {
    const health = calcHealth(kami);
    const output = calcOutput(kami);

    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats.health * 1}`, // multiply by 1 to interpret hex
      `Harmony: ${kami.stats.harmony * 1}`,
      `Violence: ${kami.stats.violence * 1}`,
    ];

    return (
      <KamiCard
        key={kami.index}
        kami={kami}
        description={description}
        subtext={`yours (\$${output})`}
        action={[CollectButton(kami), StopButton(kami)]}
        battery
        cooldown
      />
    );
  };

  // rendering of an enemy kami on this node
  const EnemyKard = (kami: Kami, myKamis: Kami[]) => {
    const health = calcHealth(kami);
    const output = calcOutput(kami);

    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats.health * 1}`, // multiply by 1 to interpret hex
      `Harmony: ${kami.stats.harmony * 1}`,
      `Violence: ${kami.stats.violence * 1}`,
    ];

    const validLiquidators = myKamis.filter((myKami) => {
      return canLiquidate(myKami, kami);
    });

    return (
      <KamiCard
        key={kami.index}
        kami={kami}
        subtext={`${kami.account!.name} (\$${output})`}
        action={LiquidateButton(kami, validLiquidators)}
        description={description}
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