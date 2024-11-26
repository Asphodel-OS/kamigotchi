import { World } from '@mud-classic/recs';
import { IconListButton, IconListButtonOption } from 'app/components/library';
import { Components } from 'network/components';
import { NetworkLayer } from 'network/create';
import { Account } from 'network/shapes/Account';
import { parseAllos } from 'network/shapes/Allo';
import { passesConditions } from 'network/shapes/Conditional';
import { filterInventories, Inventory, Item } from 'network/shapes/Item';
import { calcCooldown, isHarvesting, Kami } from 'network/shapes/Kami';
import { Tooltip } from '../base';

// button for feeding a kami
export const UseItemButton = (
  network: NetworkLayer,
  kami: Kami,
  account: Account,
  icon: string
) => {
  const { actions, api, components, world } = network;

  let options: IconListButtonOption[] = [];
  let tooltip = getDisabledTooltip(kami, account);

  const triggerAction = (kami: Kami, item: Item) => {
    actions.add({
      action: 'Use item on kami',
      params: [kami.id, item.index],
      description: `Using ${item.name} on ${kami.name}`,
      execute: async () => {
        return api.player.pet.use.item(kami.id, item.index);
      },
    });
  };

  const disabled = !!tooltip;
  if (!disabled) {
    tooltip = `Feed Kami`;
    options = getOptions(world, components, kami, account, triggerAction);
  }

  return (
    <Tooltip key='feed-tooltip' text={[tooltip]}>
      <IconListButton img={icon} options={options} disabled={disabled} />
    </Tooltip>
  );
};

// generate a tooltip for any reason the kami cannot be fed
const getDisabledTooltip = (kami: Kami, account: Account): string => {
  const cooldown = calcCooldown(kami);
  const inRoom = kami.harvest?.node?.roomIndex == account.roomIndex;

  let tooltip = '';
  if (isHarvesting(kami) && !inRoom) tooltip = `too far away`;
  else if (cooldown > 0) tooltip = `on cooldown (${cooldown.toFixed(0)}s)`;

  return tooltip;
};

// gets the list of IconListButton Options using an item on a kami
const getOptions = (
  world: World,
  components: Components,
  kami: Kami,
  account: Account,
  triggerAction: Function
) => {
  let inventories = account.inventories ?? [];
  inventories = filterInventories(inventories, undefined, 'KAMI');
  inventories = inventories.filter((inv) =>
    passesConditions(world, components, inv.item.requirements.use, kami)
  );

  const options = inventories.map((inv: Inventory) => {
    return getOption(world, components, kami, inv, triggerAction);
  });

  return options.filter((option) => !!option.text);
};

// get a single IconListButton Option for feeding a Kami
const getOption = (
  world: World,
  components: Components,
  kami: Kami,
  inv: Inventory,
  triggerAction: Function
) => {
  if (!inv || !inv.item) return { text: '', onClick: () => {} };

  // its not querying use correctly!
  const effectsText = parseAllos(world, components, inv.item.effects.use)
    .map((entry) => `${entry.description}`)
    .join(', ');
  const text = `${inv.item.name} (${effectsText})`;

  // const canEat = () => passesConditions(world, components, inv.item.requirements.use, kami);

  return {
    text,
    onClick: () => triggerAction(kami, inv.item),
    image: inv.item.image,
    // disabled: !canEat(),
  };
};
