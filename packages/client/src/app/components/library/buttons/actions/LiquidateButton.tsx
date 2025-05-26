import {
  calcLiqKarma,
  calcLiqStrain,
  calcLiqThreshold,
  canLiquidate,
  canMog,
  isStarving,
  onCooldown,
} from 'app/cache/kami';
import { IconListButton } from 'app/components/library';
import { LiquidateIcon } from 'assets/images/icons/actions';
import { Kami } from 'network/shapes/Kami';
import { TextTooltip } from '../..';

// button for liquidating a harvest
// TODO: clean this up
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
    <TextTooltip key='liquidate-tooltip' text={[tooltipText]}>
      <IconListButton
        key='liquidate-button'
        img={LiquidateIcon}
        options={actionOptions}
        disabled={actionOptions.length == 0}
      />
    </TextTooltip>
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
