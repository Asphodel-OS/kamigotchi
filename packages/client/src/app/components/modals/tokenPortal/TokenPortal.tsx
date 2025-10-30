import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { getAccount as _getAccount } from 'app/cache/account';
import { getPortalConfig } from 'app/cache/config';
import { getItem as _getItem } from 'app/cache/item';
import { getReceipt as _getReceipt } from 'app/cache/receipts';
import {
  EmptyText,
  HelpChip,
  IconButton,
  ModalHeader,
  ModalWrapper,
  Overlay,
  Text,
} from 'app/components/library';
import { UIComponent, useLayers } from 'app/root';
import { useNetwork, useVisibility } from 'app/stores';
import { TriggerIcons } from 'assets/images/icons/triggers';
import { TokenIcons } from 'assets/images/tokens';
import { ETH_INDEX, ONYX_INDEX } from 'constants/items';
import { EntityID, EntityIndex } from 'engine/recs';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item, NullItem, queryItems } from 'network/shapes/Item';
import { queryReceipts as _queryReceipts, Receipt } from 'network/shapes/Portal';
import { getCompAddr } from 'network/shapes/utils';
import { HELP_TEXT } from './constants';
import { Queue } from './queue';
import { Swap } from './swap';
import { getResultWithdraw, openBaselineLink } from './utils';

export const TokenPortalModal: UIComponent = {
  id: 'TokenPortal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network, data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);

      return {
        network,
        data: {
          accountEntity,
          config: getPortalConfig(world, components),
          spenderAddr: getCompAddr(world, components, 'component.token.allowance'),
        },
        utils: {
          getAccount: () => _getAccount(world, components, accountEntity, { inventory: 2 }),
          getItem: (entity: EntityIndex) => _getItem(world, components, entity),
          getReceipt: (entity: EntityIndex) => _getReceipt(world, components, entity),
          queryReceipts: () => _queryReceipts(components),
          queryTokenItems: () => queryItems(components, { registry: true, type: 'ERC20' }),
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { actions } = network;
    const { accountEntity, config, spenderAddr } = data;
    const { getAccount, getItem, getReceipt, queryTokenItems, queryReceipts } = utils;

    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const isOpen = useVisibility((s) => s.modals.tokenPortal);

    const [account, setAccount] = useState<Account>(NullAccount);
    const [options, setOptions] = useState<Item[]>([]);
    const [selected, setSelected] = useState<Item>(NullItem); // selected item for import/export
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [showQueue, setShowQueue] = useState<boolean>(false);
    const [tick, setTick] = useState(Date.now());

    /////////////////
    // SUBSCRIPTIONS

    // on mount, retrieve the list of ERC20 items and default to ONYX
    useEffect(() => {
      const itemEntites = queryTokenItems();
      const items = itemEntites.map((item) => getItem(item)) as Item[];
      const cleaned = items.filter((item) => item.index !== ETH_INDEX);
      setOptions(cleaned);

      // set up ticking
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, 1000);
      return () => clearInterval(timerId);
    }, []);

    // default the selected option to ONYX whenever the list of item options change
    useEffect(() => {
      const onyxItem = options.find((item: Item) => item.index === ONYX_INDEX);
      if (onyxItem) setSelected(onyxItem);
      else console.warn('no onyx item found');
    }, [options.length]);

    // set the account if the connected entity changes
    useEffect(() => {
      if (!accountEntity) return;
      const account = getAccount();
      setAccount(account);
    }, [accountEntity]);

    // query for the list of Receipts
    // TODO: set up a caching for receipts
    useEffect(() => {
      if (!isOpen) return;
      const receiptEntities = queryReceipts();
      const receipts = receiptEntities.map((receipt) => getReceipt(receipt));
      setReceipts(receipts);
      getAccount();
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
        description: `Approving ${amt} $ONYX to be spent`,
        execute: async () => {
          return api.erc20.approve(item.token?.address!, spenderAddr, amt);
        },
      });
    };

    // deposit ERC20 tokens into the game world
    const depositTx = async (item: Item, amt: number, convertAmt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const scale = item.token?.scale ?? 0;
      const tokenAmt = convertAmt / 10 ** scale;

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenDeposit',
        params: [item.index, amt],
        description: `Depositing ${tokenAmt.toFixed(scale)} $ONYX for ${amt} ${item.name}`,
        execute: async () => api.portal.ERC20.deposit(item.index, convertAmt),
      });
    };

    // initiate a withdraw by creating a time-locked withdrawal receipt
    const withdrawTx = async (item: Item, amt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const taxedAmt = getResultWithdraw(config, amt);
      const scale = item.token?.scale ?? 0;
      const tokenAmt = taxedAmt / 10 ** scale;

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
        header={<ModalHeader title='Token Portal' icon={TokenIcons.onyx} />}
        canExit
        overlay
        noPadding
        truncate
      >
        <Overlay left={0.6} top={0.6}>
          <HelpChip tooltip={{ text: HELP_TEXT, size: 0.6 }} size={1.2} />
        </Overlay>
        <Overlay right={0.6} top={0.6}>
          <Text
            size={0.6}
            color='#3b3'
            onClick={() => openBaselineLink(selected.token?.address ?? '')}
          >
            Purchase $ONYX
          </Text>
        </Overlay>
        {!accountEntity ? (
          <EmptyText text={['Failed to Connect Account']} size={1} />
        ) : (
          <Swap
            actions={{
              approve: approveTx,
              deposit: depositTx,
              withdraw: withdrawTx,
            }}
            data={{ account, config, inventory: account.inventories ?? [] }}
            state={{ options, selected, setSelected }}
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
