import { IconListButton, IconListButtonOption } from 'app/components/library';
import { feedIcon } from 'assets/images/icons/actions';
import { Account, hasFood } from 'network/shapes/Account';
import { filterInventories, Inventory } from 'network/shapes/Item';
import { isFull, isHarvesting, Kami, onCooldown } from 'network/shapes/Kami';
import { Tooltip } from '../Tooltip';

// Feed Button display evaluation
export const FeedButton = (kami: Kami, account: Account, triggerFeed: Function) => {
  let tooltip = '';
  let options: IconListButtonOption[] = [];

  // check whether the kami can be fed and generate a tooltip for the reason
  const inRoom = kami.production?.node?.roomIndex == account.roomIndex;
  if (isHarvesting(kami) && !inRoom) tooltip = `too far away`;
  else if (!hasFood(account)) tooltip = `buy food, poore`;
  else if (onCooldown(kami)) tooltip = `can't eat, on cooldown`;

  // determine whether disabled and if not, filter down to available food items
  const disabled = !!tooltip;
  if (!disabled) tooltip = `Feed Kami`;
  else options = getFeedOptions(kami, account, triggerFeed);

  return (
    <Tooltip key='feed-tooltip' text={[tooltip]}>
      <IconListButton img={feedIcon} options={options} disabled={disabled} />
    </Tooltip>
  );
};

// gets the list of IconListButton Options for feeding a kami
const getFeedOptions = (kami: Kami, account: Account, triggerFeed: Function) => {
  let inventory = filterInventories(account.inventories ?? [], 'consumable', 'kami');
  inventory = inventory.filter((inv: Inventory) => inv?.item.index !== 110) ?? [];

  const options = inventory.map((inv: Inventory) => {
    const feedAction = () => triggerFeed(kami, inv.item.index);
    return getFeedOption(kami, inv, feedAction);
  });

  return options.filter((option) => !!option.text);
};

// get a single IconListButton Option for feeding a Kami
const getFeedOption = (kami: Kami, inv: Inventory, triggerFeed: Function) => {
  if (!inv || !inv.item) return { text: '', onClick: () => {} };

  const healAmt = inv.item.stats?.health.sync ?? 0;
  const expAmt = inv.item.experience ?? 0;
  const canEat = () => !isFull(kami) || healAmt == 0;

  let text = `${inv.item.name}`;
  if (healAmt > 0) text += ` (+${healAmt}hp)`;
  if (expAmt > 0) text += ` (+${expAmt}xp)`;

  return {
    text,
    onClick: () => triggerFeed(),
    image: inv.item.image,
    disabled: !canEat(),
  };
};
