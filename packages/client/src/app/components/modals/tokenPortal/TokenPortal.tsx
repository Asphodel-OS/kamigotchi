import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { getAccount } from 'app/cache/account';
import { getItem } from 'app/cache/item';
import { EmptyText, IconButton, ModalHeader, ModalWrapper, Overlay } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useNetwork, useVisibility } from 'app/stores';
import { TriggerIcons } from 'assets/images/icons/triggers';
import { ItemImages } from 'assets/images/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item, NullItem, queryItems } from 'network/shapes/Item';
import { getReceipt, queryReceipts, Receipt } from 'network/shapes/Portal';
import { getCompAddr } from 'network/shapes/utils';
import { Swap } from './Swap';
import { Queue } from './queue/Queue';

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
            getReceipt: (entity: EntityIndex) =>
              getReceipt(world, components, entity, { account: true, item: true }),
            queryReceipts: () => queryReceipts(components),
            queryTokenItems: () => queryItems(components, { registry: true, type: 'ERC20' }),
          },
        };
      })
    );
  },
  Render: ({ network, data, utils }) => {
    const { actions } = network;
    const { accountEntity, spenderAddr } = data;
    const { getAccount, getItem, getReceipt, queryTokenItems, queryReceipts } = utils;
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const isOpen = useVisibility((s) => s.modals.tokenPortal);

    const [account, setAccount] = useState<Account>(NullAccount);
    const [options, setOptions] = useState<Item[]>([]);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [selected, setSelected] = useState<Item>(NullItem); // selected item for import/export
    const [showQueue, setShowQueue] = useState<boolean>(false);
    const [tick, setTick] = useState(Date.now());

    // on mount, retrieve the list of ERC20 items and default to ONYX
    useEffect(() => {
      const itemEntites = queryTokenItems();
      const items = itemEntites.map((item: Item) => getItem(item)) as Item[];
      setOptions(items);

      // set up ticking
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, 1000);
      return () => clearInterval(timerId);
    }, []);

    // set the account if the connected entity changes
    useEffect(() => {
      if (!accountEntity) return;
      const account = getAccount(accountEntity);
      setAccount(account);
    }, [accountEntity]);

    // query for the list of Receipts
    // TODO: set up a caching for receipts
    useEffect(() => {
      if (!isOpen) return;
      const receiptEntities = queryReceipts();
      const receipts = receiptEntities.map((receipt: Receipt) => getReceipt(receipt));
      setReceipts(receipts);
    }, [isOpen, tick]);

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
        description: `Approve ${amt} $ONYX to be spent`,
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
        description: `Claiming withdrawal of ${receipt.amt / 10 ** 18} $ONYX`,
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
        description: `Canceling withdrawal of ${receipt.amt / 10 ** 18} $ONYX`,
        execute: async () => api.portal.ERC20.cancel(receipt.id),
      });
    };

    /////////////////
    // DISPLAY

    return (
      <ModalWrapper
        id='tokenPortal'
        header={<ModalHeader title='Token Portal' icon={ItemImages.onyx} />}
        canExit
        overlay
        noPadding
        truncate
      >
        {!accountEntity ? (
          <EmptyText text={['Failed to Connect Account']} size={1} />
        ) : (
          <Swap
            actions={{
              approve: approveTx,
              deposit: depositTx,
              withdraw: withdrawTx,
            }}
            data={{ account, inventory: account.inventories ?? [] }}
            state={{ options }}
          />
        )}
        <Overlay right={0.6} top={12.5}>
          <IconButton
            img={showQueue ? TriggerIcons.eyeOpen : TriggerIcons.eyeClosed}
            onClick={() => setShowQueue(!showQueue)}
          />
        </Overlay>
        <Queue
          actions={{
            claim: claimTx,
            cancel: cancelTx,
          }}
          data={{ account, receipts }}
          state={{ options, setOptions }}
          isVisible={showQueue}
        />
      </ModalWrapper>
    );
  },
};
