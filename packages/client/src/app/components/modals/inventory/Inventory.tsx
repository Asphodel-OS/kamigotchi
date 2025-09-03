import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { interval, map } from 'rxjs';

import { getAccount, getAccountInventories, getAccountKamis } from 'app/cache/account';
import { cleanInventories, getInventoryBalance, Inventory } from 'app/cache/inventory';
import { getItemByIndex } from 'app/cache/item';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { InventoryIcon } from 'assets/images/icons/menu';
import { getKamidenClient } from 'clients/kamiden';
import { ItemTransfer, ItemTransferRequest } from 'clients/kamiden/proto';
import { OBOL_INDEX } from 'constants/items';
import {
  Account,
  NullAccount,
  queryAccountFromEmbedded,
  queryAllAccounts,
} from 'network/shapes/Account';
import { Allo, parseAllos } from 'network/shapes/Allo';
import { parseConditionalText, passesConditions } from 'network/shapes/Conditional';
import { getItemBalance, getMusuBalance, Item, NullItem } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { ItemGrid } from './ItemGrid';
import { MusuRow } from './MusuRow';
import { Send } from './Send';

const REFRESH_INTERVAL = 1000;
const REFRESH_INTERVAL_GRID = 2000;
const KamidenClient = getKamidenClient();

export const InventoryModal: UIComponent = {
  id: 'Inventory',
  requirement: (layers) => {
    return interval(1000).pipe(
      map(() => {
        const { network } = layers;
        const { world, components } = network;
        const { debug } = useAccount.getState();
        const accountEntity = queryAccountFromEmbedded(network);
        const kamiRefreshOptions = {
          live: 0,
          bonuses: 5,
          config: 3600,
          flags: 10,
          harvest: 2,
          skills: 5,
          stats: 3600,
          traits: 3600,
        };

        return {
          network,
          data: {
            accountEntity,
          },
          utils: {
            getAccount: (entity: EntityIndex) => getAccount(world, components, entity, { live: 1 }),
            getInventories: () => getAccountInventories(world, components, accountEntity),
            getKamis: () =>
              getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
            meetsRequirements: (holder: Kami | Account, item: Item) =>
              passesConditions(world, components, item.requirements.use, holder),
            getMusuBalance: () => getMusuBalance(world, components, accountEntity),
            getObolsBalance: () =>
              getItemBalance(world, components, world.entities[accountEntity], OBOL_INDEX),
            displayRequirements: (recipe: Item) =>
              recipe.requirements.use
                .map((req) => parseConditionalText(world, components, req))
                .join('\n '),
            parseAllos: (allo: Allo[]) => parseAllos(world, components, allo),
            queryAllAccounts: () => queryAllAccounts(components),
            getInventoryBalance: (inventories: Inventory[], index: number) =>
              getInventoryBalance(inventories, index),
            getEntityIndex: (entity: EntityID) => world.entityToIndex.get(entity)!,
            getItem: (index: EntityIndex) => getItemByIndex(world, components, index),
          },
        };
      })
    );
  },
  Render: ({ network, data, utils }) => {
    const { actions, api } = network;
    const { accountEntity } = data;
    const { getMusuBalance, getObolsBalance, getEntityIndex, getItem } = utils;
    const { getAccount, getInventories, getKamis, queryAllAccounts } = utils;
    const {
      burnerAddress, // embedded
      selectedAddress, // injected
      apis,
      validations: networkValidations,
    } = useNetwork();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [account, setAccount] = useState<Account>(NullAccount);
    const [tick, setTick] = useState(Date.now());
    const [sendView, setSendView] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [sendHistory, setSendHistory] = useState<ItemTransfer[]>([]);
    const [visible, setVisible] = useState(false);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [kamis, setKamis] = useState<Kami[]>([]);
    const [targetAcc, setTargetAcc] = useState<Account | null>(null);
    const [amt, setAmt] = useState<number>(1);
    const [item, setItem] = useState<Item>(NullItem);

    const { modals } = useVisibility();

    // mounting
    useEffect(() => {
      // populate initial data
      setAccount(getAccount(accountEntity, { live: 0, inventory: 2 }));
      // set ticking
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
      return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
      if (!modals.inventory) return;
      updateData();
      const timerId = setInterval(() => {
        updateData();
      }, REFRESH_INTERVAL_GRID);
      return () => clearInterval(timerId);
    }, [modals.inventory, accountEntity]);

    // update account and kamis every tick or if the connnected account changes
    useEffect(() => {
      if (!modals.inventory) return;
      // update the connected account if it changes
      if (accountEntity != account.entity) {
        setAccount(getAccount(accountEntity, { live: 0, inventory: 2 }));
      }

      // check if we need to update the list of accounts
      const accountEntities = queryAllAccounts() as EntityIndex[];
      if (accountEntities.length > accounts.length) {
        const filtered = accountEntities.filter((entity) => entity != accountEntity);
        const newAccounts = filtered.map((entity) => getAccount(entity));
        const accountsSorted = newAccounts.sort((a, b) => a.name.localeCompare(b.name));
        setAccounts(accountsSorted);
      }
      getSendHistoryKamiden(account.id);
    }, [modals.inventory, tick, accountEntity]);

    // for the shuffle animation
    const triggerShuffle = () => {
      setSendView(!sendView);
      setTimeout(() => setShuffle(true), 100);
      setTimeout(() => setShuffle(false), 500);
    };
    /////////////////
    // ACTIONS

    const useForKami = (kami: Kami, item: Item) => {
      actions.add({
        action: 'KamiFeed',
        params: [kami.id, item.index],
        description: `Using ${item.name} on ${kami.name}`,
        execute: async () => {
          return api.player.pet.item.use(kami.id, item.index);
        },
      });
    };

    const useForAccount = (item: Item, amount: number) => {
      let actionKey = 'Using';
      if (item.type === 'LOOTBOX') actionKey = 'Opening';

      actions.add({
        action: 'AccountFeed',
        params: [item.index],
        description: `${actionKey} ${item.name}`,
        execute: async () => {
          return api.player.account.item.use(item.index, amount);
        },
      });
    };

    // send a list of items to another account
    const sendItemsTx = (items: Item[], amts: number[], account: Account) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);
      const actionID = uuid() as EntityID;
      const itemsIndexes = items.map((item) => item.index);
      const itemsNames = items.map((item) => item.name);
      const itemamts = items.map((item) => item.index);
      //  console.log(`accountid selected: ${account.id} BigNumber ${Number(account.id)}`);
      actions!.add({
        id: actionID,
        action: 'ItemTransfer',
        params: [itemsIndexes, amts, account.id],
        description: `Sending ${itemamts} ${itemsNames} to ${account.name}`,
        execute: async () => {
          return api.account.item.transfer(itemsIndexes, amts, account.id);
        },
      });
      return actionID;
    };

    async function getSendHistoryKamiden(accountId: string) {
      const parsedAccountId = BigInt(accountId).toString();
      try {
        const request: ItemTransferRequest = {
          AccountID: parsedAccountId,
          //  Timestamp: '0',
        };
        const response = await KamidenClient?.getItemTransfers(request);
        setSendHistory(response?.Transfers || []);
      } catch (error) {
        console.error('Error getting send history :', error);
        throw error;
      }
    }

    // update the inventory, account and kami data
    const updateData = () => {
      const account = getAccount(accountEntity);
      setAccount(account);

      // get, clean, and set account inventories
      const rawInventories = getInventories() ?? [];
      const inventories = cleanInventories(rawInventories);
      setInventories(inventories);

      // get, and set account kamis
      setKamis(getKamis());
    };

    /////////////////
    // DISPLAY

    return (
      <ModalWrapper
        id='inventory'
        header={<ModalHeader title='Inventory' icon={InventoryIcon} />}
        footer={
          <MusuRow
            key='musu'
            data={{ musu: getMusuBalance(), obols: getObolsBalance(), sendView }}
            utils={{ triggerShuffle }}
          />
        }
        canExit
        overlay
        truncate
        shuffle={shuffle}
      >
        {!accountEntity ? (
          <EmptyText text={['Failed to Connect Account']} size={1} />
        ) : (
          <>
            <ItemGrid
              key='grid'
              actions={{ useForAccount, useForKami, sendItemsTx }}
              data={{
                sendView,
                sendHistory,
                visible,
                setVisible,
                account,
                accounts,
                accountEntity,
                inventories,
                kamis,
                setSendView,
              }}
              utils={utils}
            />{' '}
            <Send
              actions={{ sendItemsTx }}
              data={{ sendView, accounts, inventory: inventories, sendHistory, account }}
              utils={{ setSendView, getInventoryBalance, getEntityIndex, getItem, getAccount }}
            />
          </>
        )}
      </ModalWrapper>
    );
  },
};
