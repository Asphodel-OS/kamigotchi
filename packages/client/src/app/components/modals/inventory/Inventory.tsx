import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { interval, map } from 'rxjs';

import { getAccount, getAccountInventories, getAccountKamis } from 'app/cache/account';
import { getInventoryBalance, Inventory } from 'app/cache/inventory';
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
import { getItemBalance, getMusuBalance, Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { ItemGrid } from './ItemGrid';
import { MusuRow } from './MusuRow';

const REFRESH_INTERVAL = 1000;
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
          },
        };
      })
    );
  },
  Render: ({ network, data, utils }) => {
    const { actions, api } = network;
    const { accountEntity } = data;
    const { getMusuBalance, getObolsBalance } = utils;
    const { getAccount, getInventories, getKamis, meetsRequirements, queryAllAccounts } = utils;
    const {
      burnerAddress, // embedded
      selectedAddress, // injected
      apis,
      validations: networkValidations,
    } = useNetwork();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [account, setAccount] = useState<Account>(NullAccount);
    const [tick, setTick] = useState(Date.now());
    const [showSend, setShowSend] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [sendHistory, setSendHistory] = useState<ItemTransfer[]>([]);
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
    }, [modals.inventory, tick]);

    // Shuffle effect
    useEffect(() => {
      const timer = setTimeout(() => {
        setShuffle(true);
      }, 100);
      return () => clearTimeout(timer);
    }, [showSend]);

    useEffect(() => {
      if (shuffle) {
        const timer = setTimeout(() => {
          setShuffle(false);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [shuffle]);

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
    /////////////////
    // DISPLAY

    return (
      <ModalWrapper
        id='inventory'
        header={<ModalHeader title='Inventory' icon={InventoryIcon} />}
        footer={
          <MusuRow
            key='musu'
            data={{ musu: getMusuBalance(), obols: getObolsBalance(), showSend }}
            utils={{ setShowSend }}
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
              accounts={accounts}
              accountEntity={accountEntity}
              actions={{ useForAccount, useForKami, sendItemsTx }}
              data={{ showSend, sendHistory }}
              utils={{ ...utils, setShowSend }}
            />
          </>
        )}
      </ModalWrapper>
    );
  },
};
