import { IconListButton } from 'app/components/library';
import { liquidateIcon } from 'assets/images/icons/actions';
import {
  calcLiqKarma,
  calcLiqStrain,
  calcLiqThreshold,
  canLiquidate,
  canMog,
} from 'network/shapes/Harvest';
import { isStarving, Kami, onCooldown } from 'network/shapes/Kami';
import { Tooltip } from '../Tooltip';

// button for liquidating harvest
// TODO: simplify and optimize the below
export const LiquidateButton = (target: Kami, allies: Kami[], triggerAction: Function) => {
  const options = allies.filter((ally) => canLiquidate(ally, target));
  const actionOptions = options.map((myKami) => {
    const karma = calcLiqKarma(myKami, target);
    const strain = calcLiqStrain(myKami, target);

    return {
      text: `${myKami.name} (recoil: ${karma} + ${strain})`,
      onClick: () => triggerAction(myKami, target),
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
