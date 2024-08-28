import { IconListButton, IconListButtonOption } from 'app/components/library';
import { feedIcon } from 'assets/images/icons/actions';
import { Account, hasFood } from 'network/shapes/Account';
import { filterInventories, Inventory } from 'network/shapes/Item';
import { calcCooldown, isFull, isHarvesting, Kami } from 'network/shapes/Kami';
import { Tooltip } from '../base';

// button for feeding a kami
export const FeedButton = (kami: Kami, account: Account, triggerAction: Function) => {
  let options: IconListButtonOption[] = [];
  let tooltip = getDisabledTooltip(kami, account);

  const disabled = !!tooltip;
  if (!disabled) {
    tooltip = `Feed Kami`;
    options = getFeedOptions(kami, account, triggerAction);
  }

  return (
    <Tooltip key='feed-tooltip' text={[tooltip]}>
      <IconListButton img={feedIcon} options={options} disabled={disabled} />
    </Tooltip>
  );
};

// generate a tooltip for any reason the kami cannot be fed
const getDisabledTooltip = (kami: Kami, account: Account): string => {
  const cooldown = calcCooldown(kami);
  const inRoom = kami.production?.node?.roomIndex == account.roomIndex;

  let tooltip = '';
  if (isHarvesting(kami) && !inRoom) tooltip = `too far away`;
  else if (!hasFood(account)) tooltip = `buy food, poore`;
  else if (cooldown > 0) tooltip = `on cooldown (${cooldown.toFixed(0)}s)`;

  return tooltip;
};

// gets the list of IconListButton Options for feeding a kami
const getFeedOptions = (kami: Kami, account: Account, triggerAction: Function) => {
  let inventories = account.inventories ?? [];
  inventories = filterInventories(inventories, 'FOOD', 'KAMI');

  const options = inventories.map((inv: Inventory) => {
    const feedAction = () => triggerAction(kami, inv.item.index);
    return getFeedOption(kami, inv, feedAction);
  });

  return options.filter((option) => !!option.text);
};

// get a single IconListButton Option for feeding a Kami
const getFeedOption = (kami: Kami, inv: Inventory, triggerAction: Function) => {
  if (!inv || !inv.item) return { text: '', onClick: () => {} };

  const healAmt = inv.item.stats?.health.sync ?? 0;
  const expAmt = inv.item.experience ?? 0;
  const canEat = () => !isFull(kami) || healAmt == 0;

  let text = `${inv.item.name}`;
  if (healAmt > 0) text += ` (+${healAmt}hp)`;
  if (expAmt > 0) text += ` (+${expAmt}xp)`;

  return {
    text,
    onClick: () => triggerAction(),
    image: inv.item.image,
    disabled: !canEat(),
  };
};
