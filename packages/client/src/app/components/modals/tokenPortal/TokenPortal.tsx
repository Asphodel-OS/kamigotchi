import { EntityIndex } from '@mud-classic/recs';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccount } from 'app/cache/account';
import { getItem } from 'app/cache/item';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useNetwork, useTokens } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { ONYX_INDEX } from 'constants/items';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item, NullItem, queryItems } from 'network/shapes/Item';
import { Receipt } from 'network/shapes/Portal';
import { useEffect, useState } from 'react';

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
    const { actions, api } = network;
    const { accountEntity } = data;
    const { getItem, queryTokenItems } = utils;
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const { allowance: onyxAllowance, balance: onyxBalance } = useTokens((s) => s.onyx);

    const [options, setOptions] = useState<Item[]>([]);
    const [selected, setSelected] = useState<Item>(NullItem);

    useEffect(() => {
      const itemEntites = queryTokenItems();
      const items = itemEntites.map((item: Item) => getItem(item)) as Item[];
      setOptions(items);

      const onyxItem = items.find((item: Item) => item.index == ONYX_INDEX);
      if (onyxItem) setSelected(onyxItem);
      else console.warn('no onyx item found');
    }, []);

    /////////////////
    // ACTIONS

    const depositTx = async (item: Item, amt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const scale = item.token?.scale ?? 0;
      const tokenAmt = amt / 10 ** scale;

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenDeposit',
        params: [item.index, amt],
        description: `Depositing ${tokenAmt.toFixed(scale)} $ONYX for ${amt} item`,
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
        description: `Withdrawing ${amt} item for ${tokenAmt.toFixed(scale)} $ONYX`,
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
          <div>
            {onyxAllowance}
            <div>{onyxBalance}</div>
          </div>
        )}
      </ModalWrapper>
    );
  },
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.4vw;
  padding: 0.6vw;
`;
