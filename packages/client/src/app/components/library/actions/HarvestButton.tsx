import { calcCooldown, isHarvesting, isResting, isStarving, Kami } from 'app/cache/kami';
import { IconListButton, IconListButtonOption } from 'app/components/library';
import { HarvestIcon, StopIcon } from 'assets/images/icons/actions';
import { NetworkLayer } from 'network/create';
import { Account } from 'network/shapes/Account';
import { Node, passesNodeReqs } from 'network/shapes/Node';
import { Tooltip } from '../base';

// if resting
// - always display
// - only option is Start
// - disable on cooldown
// - disable if requirements not met
// if harvesting
// - always display
// - check if in current room
// - options are Collect, Stop
// - disable on cooldwon
// if dead
// - dont display

interface Props {
  network: NetworkLayer;
  account: Account;
  kami: Kami;
  node: Node;
}

// A button for accessing harvest actions
// Assumptions
// - target kami is alive (harvesting/resting)
// - node is accessible through kami harvest if harvesting
export const HarvestButton = (props: Props) => {
  const { network, kami, account, node } = props;

  let options: IconListButtonOption[] = [];
  let tooltip = getDisabledTooltip(network, account, kami, node);

  let disabled = !!tooltip;
  if (!disabled) {
    tooltip = `Harvest Actions`;
    options = getOptions(network, kami, node);
  }

  return (
    <Tooltip key='harvest-tooltip' text={[tooltip]}>
      <IconListButton img={HarvestIcon} options={options} disabled={disabled} />
    </Tooltip>
  );
};

/////////////////
// INTERPRETATION

// generate a tooltip for any reason the kami cannot be fed
const getDisabledTooltip = (
  network: NetworkLayer,
  account: Account,
  kami: Kami,
  node: Node
): string => {
  const { world, components } = network;
  const cooldown = calcCooldown(kami);
  const passes = passesNodeReqs(world, components, node.index, kami);
  const inRoom = kami.harvest?.node?.roomIndex == account.roomIndex;

  let tooltip = '';
  if (isHarvesting(kami) && !inRoom) tooltip = `too far away`;
  else if (isStarving(kami)) tooltip = `starving :(`;
  else if (node.index == 0) tooltip = `there is no node here`;
  else if (isResting(kami) && !passes) tooltip = `doesn't pass node requirements`;
  else if (cooldown > 0) tooltip = `on cooldown (${cooldown.toFixed(0)}s)`;
  return tooltip;
};

// gets the list of IconListButton Options using an item on a kami
const getOptions = (network: NetworkLayer, kami: Kami, node: Node) => {
  const collectOption = {
    text: 'Collect Harvest',
    onClick: () => harvestCollect(network, kami),
    image: HarvestIcon,
  };

  const startOption = {
    text: 'Start Harvest',
    onClick: () => harvestStart(network, kami, node),
    image: HarvestIcon,
  };

  const stopOption = {
    text: 'Stop Harvest',
    onClick: () => harvestStop(network, kami),
    image: StopIcon,
  };

  if (isResting(kami)) return [startOption];
  else if (isHarvesting(kami)) return [collectOption, stopOption];
  return [];
};

/////////////////
// ACTIONS

// collect an active harvest
const harvestCollect = (network: NetworkLayer, kami: Kami) => {
  const { actions, api } = network;
  if (!kami.harvest) {
    console.error(`No harvest found for ${kami.name}`);
    return;
  }

  const harvest = kami.harvest;
  actions.add({
    action: 'Use item on kami',
    params: [harvest.id],
    description: `Collecting harvest for ${kami.name}`,
    execute: async () => {
      return api.player.pet.harvest.collect([harvest.id]);
    },
  });
};

// start a harvest
const harvestStart = (network: NetworkLayer, kami: Kami, node: Node) => {
  const { actions, api } = network;
  actions.add({
    action: 'Use item on kami',
    params: [kami.id, node.id],
    description: `Deploying ${kami.name} onto ${node.name}`,
    execute: async () => {
      return api.player.pet.harvest.start([kami.id], node.index);
    },
  });
};

// stop a harvest
const harvestStop = (network: NetworkLayer, kami: Kami) => {
  const { actions, api } = network;
  if (!kami.harvest) {
    console.error(`No harvest found for ${kami.name}`);
    return;
  }

  const harvest = kami.harvest;
  actions.add({
    action: 'Use item on kami',
    params: [harvest.id],
    description: `Stopping harvest for ${kami.name}`,
    execute: async () => {
      return api.player.pet.harvest.stop([harvest.id]);
    },
  });
};
