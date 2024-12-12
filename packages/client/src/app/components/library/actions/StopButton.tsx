import { calcCooldown, isHarvesting, isStarving } from 'app/cache/kami';
import { stopIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { IconButton, Tooltip } from '../base';

// button for stopping a harvest
export const StopButton = (kami: Kami, account: Account, triggerAction: Function) => {
  let tooltip = getDisabledTooltip(kami, account);

  const disabled = !!tooltip;
  if (!disabled) tooltip = `Stop Harvest`;

  return (
    <Tooltip key='stop-tooltip' text={[tooltip]}>
      <IconButton
        key='stop-button'
        img={stopIcon}
        onClick={() => triggerAction(kami)}
        disabled={disabled}
      />
    </Tooltip>
  );
};

// generate a tooltip for any reason the kami's harvest cannot be stopped
const getDisabledTooltip = (kami: Kami, account: Account): string => {
  const cooldown = calcCooldown(kami);
  const inRoom = kami.harvest?.node?.roomIndex == account.roomIndex;

  let tooltip = '';
  if (!isHarvesting(kami)) tooltip = 'uhh.. not harvesting?';
  else if (!inRoom) tooltip = `too far away`;
  else if (isStarving(kami)) tooltip = 'starving :(';
  else if (cooldown > 0) tooltip = `on cooldown (${cooldown.toFixed(0)}s)`;

  return tooltip;
};
