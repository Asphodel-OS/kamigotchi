import { EntityID } from '@mud-classic/recs';
import { useNetwork, useTokens } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { NetworkLayer } from 'network/create';
import { Account } from 'network/shapes/Account';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { v4 as uuid } from 'uuid';
import { IconButton } from '../IconButton';

const PRICE = 3000;
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

interface Props {
  network: NetworkLayer;
  account: Account;
  kami: Kami;
  onyx: Item;
  spenderAddr: string; // address of world's erc20 spender
}

export const OnyxReviveButton = (props: Props) => {
  const { network, account, kami, spenderAddr, onyx } = props;
  const { actions, api } = network;
  const { selectedAddress, apis: ownerAPIs } = useNetwork();
  const { balances: tokenBal } = useTokens();
  const onyxInfo = tokenBal.get(props.onyx.address ?? EMPTY_ADDRESS);
  const balance = onyxInfo?.balance ?? 0;
  const allowance = onyxInfo?.allowance ?? 0;

  const onClick = () => {};

  // approve the spend of an ERC20 token
  const approveTx = async (payItem: Item, price: number) => {
    const api = ownerAPIs.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);

    const actionID = uuid() as EntityID;
    actions.add({
      id: actionID,
      action: 'Approve token',
      params: [payItem.address, spenderAddr, price],
      description: `Approve ${price} ${payItem.name} to be spent`,
      execute: async () => {
        return api.erc20.approve(payItem.address!, spenderAddr, price);
      },
    });
  };

  const reviveTx = async (kami: Kami) => {
    const api = ownerAPIs.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);

    const actionID = uuid() as EntityID;
    actions.add({
      id: actionID,
      action: 'Onyx revive',
      params: [kami.id],
      description: `Reviving ${kami.name} with ONYX`,
      execute: async () => {
        return api.pet.onyx.revive(kami.id);
      },
    });
  };

  return <IconButton key='onyx-revive-button' img={ItemImages.onyx} onClick={onClick} />;
};
