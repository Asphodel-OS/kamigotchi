import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconButton, IconListButton, KamiCard, Tooltip } from 'app/components/library';
import { FeedButton } from 'app/components/library/actions';
import { useSelected, useVisibility } from 'app/stores';
import { collectIcon, liquidateIcon, stopIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import {
  calcLiqKarma,
  calcLiqStrain,
  calcLiqThreshold,
  canLiquidate,
  canMog,
} from 'network/shapes/Harvest';
import {
  Kami,
  calcCooldown,
  calcHealth,
  calcOutput,
  isStarving,
  onCooldown,
} from 'network/shapes/Kami';
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
}

export const Kards = (props: Props) => {
  const { actions, account, allies, enemies } = props;
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
      reason = 'On cooldown (' + calcCooldown(kami).toFixed(0) + 's left)';
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
    const valid = available.filter((kami) => canMog(kami, target));
    if (valid.length == 0 && reason === '') {
      // get the details of the highest cap liquidation
      const thresholds = available.map((ally) => calcLiqThreshold(ally, target));
      const [threshold, index] = thresholds.reduce(
        (a, b, i) => (a[0] < b ? [b, i] : a),
        [Number.MIN_VALUE, -1]
      );
      const champion = available[index];
      reason = `${champion?.name} can liquidate below ${Math.round(threshold)} Health`;
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

  // button for stopping production
  const StopButton = (kami: Kami) => {
    return (
      <Tooltip key='stop-tooltip' text={[getStopTooltip(kami)]}>
        <IconButton
          key='stop-button'
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
    const options = allies.filter((ally) => canLiquidate(ally, target));
    const actionOptions = options.map((myKami) => {
      const karma = calcLiqKarma(myKami, target);
      const strain = calcLiqStrain(myKami, target);

      return {
        text: `${myKami.name} (recoil: ${karma} + ${strain})`,
        onClick: () => actions.liquidate(myKami, target),
      };
    });

    let tooltipText = getLiquidateTooltip(target, allies);
    return (
      <Tooltip key='liquidate-tooltip' text={[tooltipText]}>
        <IconListButton
          key='liquidate-button'
          img={liquidateIcon}
          options={actionOptions}
          disabled={actionOptions.length == 0}
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
        key={kami.index}
        kami={kami}
        description={getDescription(kami)}
        subtext={`yours (\$${output})`}
        actions={[FeedButton(kami, account, actions.feed), CollectButton(kami), StopButton(kami)]}
        showBattery
        showCooldown
      />
    );
  };

  // rendering of an enemy kami on this node
  const EnemyKard = (kami: Kami, myKamis: Kami[]) => {
    return (
      <KamiCard
        key={kami.index}
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
    <Container>
      {allies && allies.length > 0 && <Label>Allies</Label>}
      {allies.map((ally: Kami) => MyKard(ally))}
      {enemies && enemies.length > 0 && <Label>Enemies</Label>}
      {enemies.map((enemy: Kami) => EnemyKard(enemy, allies))}
    </Container>
  );
};

const Container = styled.div`
  padding: 0.4vw;
  gap: 0.3vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Label = styled.div`
  font-size: 1.2vw;
  color: #333;
  text-align: left;
  padding: 0.2vw;
  padding-top: 0.8vw;
`;
