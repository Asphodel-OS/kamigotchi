import { getInventoryBalance } from 'app/cache/inventory';
import { isDead } from 'app/cache/kami';
import { ItemImages } from 'assets/images/items';
import { ONYX_INDEX } from 'constants/items';
import { NetworkLayer } from 'network/create';
import { Account } from 'network/shapes';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { TextTooltip } from '../../tooltips';
import { IconButton } from '../IconButton';

const PRICE = 33;

export const OnyxReviveButton = ({
  network,
  account,
  kami,
}: {
  network: NetworkLayer;
  account: Account;
  kami: Kami;
}) => {
  const { actions, api } = network;

  /////////////////
  // INTERACTION

  // handle the button being clicked
  const handleClick = () => {
    triggerAction(kami);
    playClick();
  };

  // trigger the onyx revive action on the target kami
  const triggerAction = (kami: Kami) => {
    actions.add({
      action: 'Onyx Revive',
      params: [kami.index],
      description: `Reviving ${kami.name} with Onyx Shards`,
      execute: async () => {
        return api.player.pet.onyx.revive(kami.index);
      },
    });
  };

  /////////////////
  // INTERPRETATION

  // get the balance of onyx shards
  const getBalance = (account: Account) => {
    const inventories = account.inventories ?? [];
    const balance = getInventoryBalance(inventories, ONYX_INDEX);
    return balance;
  };

  // get the tooltip for the button
  const getTooltip = () => {
    const balance = getBalance(account);
    const tooltip = [`( Price: ${PRICE} Shards )`];
    if (balance < PRICE) tooltip.push(`you need ${PRICE - balance} more Onyx Shards`);
    if (!isDead(kami)) tooltip.push('this Kami is still alive..');
    return tooltip;
  };

  /////////////////
  // DISPLAY

  return (
    <TextTooltip title={`Revive your Kami with Onyx`} text={getTooltip()} maxWidth={24}>
      <IconButton
        key='onyx-button'
        img={ItemImages.onyx_shard}
        onClick={handleClick}
        disabled={!isDead(kami) || getBalance(account) < PRICE}
      />
    </TextTooltip>
  );
};
