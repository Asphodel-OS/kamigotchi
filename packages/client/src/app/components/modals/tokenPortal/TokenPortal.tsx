import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { getAccount } from 'app/cache/account';
import { getItem } from 'app/cache/item';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useNetwork } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { ONYX_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item, NullItem, queryItems } from 'network/shapes/Item';
import { Receipt } from 'network/shapes/Portal';
import { getCompAddr } from 'network/shapes/utils';
import { Controls } from './Controls';

export const TokenPortalModal: UIComponent = {
  id: 'TokenPortal',
  requirement: (layers) => {
    return interval(1000).pipe(
      map(() => {
        const { network } = layers;
        const { world, components } = network;
        const accountEntity = queryAccountFromEmbedded(network);

        return {
          network,
          data: {
            accountEntity,
            spenderAddr: getCompAddr(world, components, 'component.token.allowance'),
          },
          utils: {
            getAccount: () => getAccount(world, components, accountEntity, { inventory: 2 }),
            getItem: (entity: EntityIndex) => getItem(world, components, entity),
            queryTokenItems: () => queryItems(components, { registry: true, type: 'ERC20' }),
          },
        };
      })
    );
  },
  Render: ({ network, data, utils }) => {
    const { actions } = network;
    const { accountEntity, spenderAddr } = data;
    const { getAccount, getItem, queryTokenItems } = utils;
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);

    const [options, setOptions] = useState<Item[]>([]);
    const [selected, setSelected] = useState<Item>(NullItem);
    const [account, setAccount] = useState<Account>(NullAccount);

    useEffect(() => {
      const itemEntites = queryTokenItems();
      const items = itemEntites.map((item: Item) => getItem(item)) as Item[];
      setOptions(items);

      const onyxItem = items.find((item: Item) => item.index == ONYX_INDEX);
      if (onyxItem) setSelected(onyxItem);
      else console.warn('no onyx item found');
    }, []);

    useEffect(() => {
      if (!accountEntity) return;
      const account = getAccount(accountEntity);
      setAccount(account);
    }, [accountEntity]);

    /////////////////
    // ACTIONS

    // approve the spend of an ERC20 token
    // amt is in human readable units (e.g. 1eth = 1)
    const approveTx = async (item: Item, amt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const actionID = uuid() as EntityID;
      actions.add({
        id: actionID,
        action: 'Approve token',
        params: [item.token?.address, spenderAddr, amt],
        description: `Approve ${amt} ${item.name} to be spent`,
        execute: async () => {
          return api.erc20.approve(item.token?.address!, spenderAddr, amt);
        },
      });
    };

    const depositTx = async (item: Item, amt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const scale = item.token?.scale ?? 0;
      const tokenAmt = amt / 10 ** scale;

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenDeposit',
        params: [item.index, amt],
        description: `Depositing ${tokenAmt.toFixed(scale)} $ONYX for ${amt} ${item.name}`,
        execute: async () => api.portal.ERC20.deposit(item.index, amt),
      });
    };

    // initiate a withdraw by creating a time-locked withdrawal receipt
    const withdrawTx = async (item: Item, amt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const scale = item.token?.scale ?? 0;
      const tokenAmt = amt / 10 ** scale;

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenWithdraw',
        params: [item.index, amt],
        description: `Withdrawing ${amt} ${item.name} for ${tokenAmt.toFixed(scale)} $ONYX`,
        execute: async () => api.portal.ERC20.withdraw(item.index, amt),
      });
    };

    // claim a withdrawal receipt whose time has come
    const claimTx = async (receipt: Receipt) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenReceiptClaim',
        params: [receipt.id],
        description: `Claiming withdrawal of ${receipt.amount} $ONYX`,
        execute: async () => api.portal.ERC20.claim(receipt.id),
      });
    };

    // cancel a withdrawal receipt
    const cancelTx = async (receipt: Receipt) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenReceiptCancel',
        params: [receipt.id],
        description: `Canceling withdrawal of ${receipt.amount} $ONYX`,
        execute: async () => api.portal.ERC20.cancel(receipt.id),
      });
    };

    /////////////////
    // DISPLAY

    return (
      <ModalWrapper
        id='tokenPortal'
        header={<ModalHeader title='Onyx Portal' icon={ItemImages.onyx} />}
        canExit
        overlay
        truncate
      >
        {!accountEntity ? (
          <EmptyText text={['Failed to Connect Account']} size={1} />
        ) : (
          <Controls
            actions={{
              approve: approveTx,
              deposit: depositTx,
              withdraw: withdrawTx,
              claim: claimTx,
              cancel: cancelTx,
            }}
            data={{ account, inventory: account.inventories ?? [] }}
            state={{ selected, setSelected, options, setOptions }}
          />
        )}
      </ModalWrapper>
    );
  },
};
