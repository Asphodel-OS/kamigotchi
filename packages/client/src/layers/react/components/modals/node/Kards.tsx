import { useEffect, useState } from 'react';

import { collectIcon, feedIcon, liquidateIcon, stopIcon } from 'assets/images/icons/actions';
import { Account } from 'layers/network/shapes/Account';
import { Inventory } from 'layers/network/shapes/Inventory';
import {
  Kami,
  calcCooldownRemaining,
  calcHealth,
  calcLiqThresholdValue,
  calcOutput,
  canLiquidate,
  canMog,
  isFull,
  isHarvesting,
  isStarving,
  onCooldown,
} from 'layers/network/shapes/Kami';
import { LiquidationConfig } from 'layers/network/shapes/LiquidationConfig';
import { IconButton } from 'layers/react/components/library/IconButton';
import { IconListButton } from 'layers/react/components/library/IconListButton';
import { KamiCard } from 'layers/react/components/library/KamiCard';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { useSelected, useVisibility } from 'layers/react/store';
import { playClick } from 'utils/sounds';

interface Props {
  account: Account;
  actions: {
    collect: (kami: Kami) => void;
    feed: (kami: Kami, itemIndex: number) => void;
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  allies: Kami[];
  enemies: Kami[];
  battleConfig: LiquidationConfig;
  tab: string;
}

export const Kards = (props: Props) => {
  const { actions, account, battleConfig } = props;
  const { modals, setModals } = useVisibility();
  const { accountIndex, setAccount } = useSelected();

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

  // get the description on the card
  const getDescription = (kami: Kami): string[] => {
    const health = calcHealth(kami);
    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats.health.total}`,
      `Harmony: ${kami.stats.harmony.total}`,
      `Violence: ${kami.stats.violence.total}`,
    ];
    return description;
  };

  // derive general disabled reason for allied kami
  const getDisabledReason = (kami: Kami): string => {
    let reason = '';
    if (onCooldown(kami)) {
      reason = 'On cooldown (' + calcCooldownRemaining(kami).toFixed(0) + 's left)';
    } else if (isStarving(kami)) {
      reason = 'starving :(';
    }
    return reason;
  };

  // evaluate tooltip for allied kami Collect button
  const getCollectTooltip = (kami: Kami): string => {
    let text = getDisabledReason(kami);
    if (text === '') text = 'Collect Harvest';
    return text;
  };

  // evaluate tooltip for allied kami Stop button
  const getStopTooltip = (kami: Kami): string => {
    let text = getDisabledReason(kami);
    if (text === '') text = 'Stop Harvest';
    return text;
  };

  const getLiquidateTooltip = (target: Kami, allies: Kami[]): string => {
    let reason = '';
    let available = [...allies];
    if (available.length == 0) {
      reason = "your kamis aren't on this node";
    }

    available = available.filter((kami) => !isStarving(kami));
    if (available.length == 0 && reason === '') {
      reason = 'your kamis are starving';
    }

    available = available.filter((kami) => !onCooldown(kami));
    if (available.length == 0 && reason === '') {
      reason = 'your kamis are on cooldown';
    }

    // check what the liquidation threshold is for any kamis that have made it to
    const valid = available.filter((kami) => canMog(kami, target, battleConfig));
    if (valid.length == 0 && reason === '') {
      // get the details of the highest cap liquidation
      const thresholds = available.map((ally) => calcLiqThresholdValue(ally, target, battleConfig));
      const [threshold, index] = thresholds.reduce(
        (a, b, i) => (a[0] < b ? [b, i] : a),
        [Number.MIN_VALUE, -1]
      );
      const champion = available[index];
      reason = `${champion.name} can liquidate at ${Math.round(threshold)} Health`;
    }

    if (reason === '') reason = 'Liquidate this Kami';
    return reason;
  };

  /////////////////
  // INTERACTION

  // toggle the node modal to the selected one
  const selectAccount = (index: number) => {
    if (!modals.account) setModals({ ...modals, account: true });
    if (accountIndex !== index) setAccount(index);
    playClick();
  };

  // returns the onClick function for the description
  const getSubtextOnClick = (kami: Kami) => {
    return () => selectAccount(kami.account?.index ?? accountIndex);
  };

  ///////////////////
  // DISPLAY (buttons)

  // button for collecting on production
  const CollectButton = (kami: Kami) => {
    return (
      <Tooltip key='collect-tooltip' text={[getCollectTooltip(kami)]}>
        <IconButton
          onClick={() => actions.collect(kami)}
          img={collectIcon}
          disabled={kami.production === undefined || getDisabledReason(kami) !== ''}
          noMargin
        />
      </Tooltip>
    );
  };

  // Feed Button display evaluation
  const FeedButton = (kami: Kami, account: Account) => {
    // filter down to available food items
    const stockedInventory =
      account.inventories?.food?.filter((inv: Inventory) => inv.balance && inv.balance > 0) ?? [];

    const feedOptions = stockedInventory.map((inv: Inventory) => {
      const healAmt = inv.item.stats?.health.sync ?? 0;
      const expAmt = inv.item.experience ?? 0;
      const canEat = () => !isFull(kami) || healAmt == 0;

      let text = `${inv.item.name}`;
      if (healAmt > 0) text += ` (+${healAmt}hp)`;
      if (expAmt > 0) text += ` (+${expAmt}xp)`;

      return {
        text,
        onClick: () => actions.feed(kami, inv.item.index),
        disabled: !canEat(),
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
      <Tooltip key='feed-tooltip' text={[tooltip]}>
        <IconListButton
          img={feedIcon}
          disabled={tooltip !== 'feed kami'}
          options={feedOptions}
          noMargin
        />
      </Tooltip>
    );
  };

  // button for stopping production
  const StopButton = (kami: Kami) => {
    return (
      <Tooltip key='stop-tooltip' text={[getStopTooltip(kami)]}>
        <IconButton
          img={stopIcon}
          onClick={() => actions.stop(kami)}
          disabled={kami.production === undefined || getDisabledReason(kami) !== ''}
          noMargin
        />
      </Tooltip>
    );
  };

  // button for liquidating production
  const LiquidateButton = (target: Kami, allies: Kami[]) => {
    const options = allies.filter((ally) => canLiquidate(ally, target, battleConfig));
    const actionOptions = options.map((myKami) => {
      return {
        text: `${myKami.name}`,
        onClick: () => actions.liquidate(myKami, target),
      };
    });

    let tooltipText = getLiquidateTooltip(target, allies);
    return (
      <Tooltip key='liquidate-tooltip' text={[tooltipText]}>
        <IconListButton
          key={`harvest-liquidate`}
          img={liquidateIcon}
          options={actionOptions}
          disabled={actionOptions.length == 0}
          noMargin
        />
      </Tooltip>
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
        actions={[FeedButton(kami, account), CollectButton(kami), StopButton(kami)]}
        showBattery
        showCooldown
      />
    );
  };

  // rendering of an enemy kami on this node
  const EnemyKard = (kami: Kami, myKamis: Kami[]) => {
    return (
      <KamiCard
        key={kami.entityIndex}
        kami={kami}
        subtext={`${kami.account?.name} (\$${calcOutput(kami)})`}
        subtextOnClick={getSubtextOnClick(kami)}
        actions={LiquidateButton(kami, myKamis)}
        description={getDescription(kami)}
        showBattery
        showCooldown
      />
    );
  };

  return (
    <>
      {props.tab === 'allies'
        ? props.allies.map((ally: Kami) => MyKard(ally))
        : props.enemies.map((enemy: Kami) => EnemyKard(enemy, props.allies))}
    </>
  );
};
