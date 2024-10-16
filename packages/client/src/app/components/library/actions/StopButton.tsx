import { stopIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { calcCooldown, isHarvesting, isStarving, Kami } from 'network/shapes/Kami';
import { Tooltip } from '../base';
import { IconButtonHybrid } from '../base/buttons/IconButtonHybrid';

// button for stopping a harvest
export const StopButton = (kami: Kami, account: Account, triggerAction: Function) => {
  let tooltip = getDisabledTooltip(kami, account);

  const disabled = !!tooltip;
  if (!disabled) tooltip = `Stop Harvest`;

  return (
    <Tooltip key='stop-tooltip' text={[tooltip]}>
      <IconButtonHybrid
        key='stop-button'
        img={stopIcon}
        onClick={() => triggerAction(kami)}
        disabled={disabled}
        noMargin
      />
    </Tooltip>
  );
};

// generate a tooltip for any reason the kami's harvest cannot be stopped
const getDisabledTooltip = (kami: Kami, account: Account): string => {
  const cooldown = calcCooldown(kami);
  const inRoom = kami.production?.node?.roomIndex == account.roomIndex;

  let tooltip = '';
  if (!isHarvesting(kami)) tooltip = 'uhh.. not harvesting?';
  else if (!inRoom) tooltip = `too far away`;
  else if (isStarving(kami)) tooltip = 'starving :(';
  else if (cooldown > 0) tooltip = `on cooldown (${cooldown.toFixed(0)}s)`;

  return tooltip;
};
