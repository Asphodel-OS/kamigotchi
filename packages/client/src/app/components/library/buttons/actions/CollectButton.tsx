import { calcCooldown, isHarvesting, isStarving } from 'app/cache/kami';
import { CollectIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { IconButton, TextTooltip } from '../..';

// button for collecting a harvest
export const CollectButton = (kami: Kami, account: Account, triggerAction: Function) => {
  let tooltip = getDisabledTooltip(kami, account);

  const disabled = !!tooltip;
  if (!disabled) tooltip = `Collect Harvest`;

  return (
    <TextTooltip key='collect-tooltip' text={[tooltip]}>
      <IconButton onClick={() => triggerAction(kami)} img={CollectIcon} disabled={disabled} />
    </TextTooltip>
  );
};

// generate a tooltip for any reason the kami's harvest cannot be collected from
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
