import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccount, getAccountInventories, getAccountKamis } from 'app/cache/account';
import { cleanInventories, getInventoryBalance, Inventory } from 'app/cache/inventory';
import { getItemByIndex } from 'app/cache/item';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { InventoryIcon } from 'assets/images/icons/menu';
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
import { didActionComplete } from 'network/utils';
import { ItemGrid } from './items/ItemGrid';
import { MusuRow } from './MusuRow';
import { Transfer } from './transfer/Transfer';
import { Mode, REFRESH_INTERVAL } from './types';

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
          bonuses: 5,
          config: 3600,
          flags: 10,
          harvest: 2,
          live: 0,
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
            displayRequirements: (recipe: Item) =>
              recipe.requirements.use
                .map((req) => parseConditionalText(world, components, req))
                .join('\n '),
            getAccount: (entity: EntityIndex) => getAccount(world, components, entity),
            getEntityIndex: (entity: EntityID) => world.entityToIndex.get(entity)!,
            getInventories: () => getAccountInventories(world, components, accountEntity),
            getInventoryBalance: (inventories: Inventory[], index: number) =>
              getInventoryBalance(inventories, index),
            getItem: (index: EntityIndex) => getItemByIndex(world, components, index),
            getKamis: () =>
              getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
            getMusuBalance: () => getMusuBalance(world, components, accountEntity),
            getObolsBalance: () =>
              getItemBalance(world, components, world.entities[accountEntity], OBOL_INDEX),
            meetsRequirements: (holder: Kami | Account, item: Item) =>
              passesConditions(world, components, item.requirements.use, holder),
            parseAllos: (allo: Allo[]) => parseAllos(world, components, allo),
            queryAllAccounts: () => queryAllAccounts(components),
          },
        };
      })
    );
  },
  Render: ({ network, data, utils }) => {
    const { actions, api } = network;
    const { accountEntity } = data;
    const { getMusuBalance, getObolsBalance, getItem, getAccount, getInventories, getKamis } =
      utils;

    const [account, setAccount] = useState<Account>(NullAccount);
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [mode, setMode] = useState<Mode>('STOCK');
    const [shuffle, setShuffle] = useState(false);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [kamis, setKamis] = useState<Kami[]>([]);
    const [resetSend, setResetSend] = useState(false);

    const inventoryModalOpen = useVisibility((s) => s.modals.inventory);
    const {
      selectedAddress, // injected
      apis,
    } = useNetwork();

    /////////////////
    // SUBSCRIPTIONS

    useEffect(() => {
      updateData();
      const refreshClock = () => setLastRefresh(Date.now());
      const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
      return () => clearInterval(timerId);
    }, []);

    // refresh data whenever the modal is opened
    useEffect(() => {
      if (!inventoryModalOpen) return;
      updateData();
    }, [inventoryModalOpen, lastRefresh, accountEntity]);

    /////////////////
    // ACTIONS

    // send a list of items to another account
    const sendItemsTx = async (items: Item[], amts: number[], account: Account) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);
      const actionID = uuid() as EntityID;
      const itemsIndexes = items.map((i) => i.index);
      const itemNames = items.map((i) => getItem(i.index as EntityIndex)?.name ?? `#${i.index}`);
      const tx = actions!.add({
        id: actionID,
        action: 'ItemTransfer',
        params: [itemsIndexes, amts, account.id],
        description:
          items.length === 1
            ? `Sending ${amts[0]} ${itemNames[0]} to ${account.name}`
            : `Sending [${amts.join(', ')}] of [${itemNames.join(', ')}] to ${account.name}`,
        execute: async () => {
          return api.account.item.transfer(itemsIndexes, amts, account.id);
        },
      });
      const completed = await didActionComplete(actions.Action, tx);
      if (completed) {
        setResetSend(true);
      }
      return actionID;
    };

    // use an item on a Kami
    const useForKamiTx = (kami: Kami, item: Item) => {
      actions.add({
        action: 'KamiFeed',
        params: [kami.id, item.index],
        description: `Using ${item.name} on ${kami.name}`,
        execute: async () => {
          return api.player.pet.item.use(kami.id, item.index);
        },
      });
    };

    // use an item on an Account
    const useForAccountTx = (item: Item, amount: number) => {
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

    /////////////////
    // GETTERS

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
    // INTERPRETATION

    // get modal title
    const getTitle = (mode: Mode) => {
      return mode === 'STOCK' ? 'Inventory' : 'Inventory Transfer';
    };

    /////////////////
    // DISPLAY

    return (
      <ModalWrapper
        id='inventory'
        header={<ModalHeader title={getTitle(mode)} icon={InventoryIcon} />}
        footer={
          <MusuRow
            key='musu'
            data={{
              musu: getMusuBalance(),
              obols: getObolsBalance(),
            }}
            state={{
              mode,
              setMode,
              setShuffle,
            }}
          />
        }
        shuffle={shuffle}
        onClose={() => {
          setMode('STOCK');
        }}
        canExit
        noPadding
        overlay
        truncate
      >
        {!accountEntity ? (
          <EmptyText text={['Failed to Connect Account']} size={1} />
        ) : (
          <>
            <ItemGrid
              key='grid'
              actions={{ useForAccount: useForAccountTx, useForKami: useForKamiTx }}
              data={{ accountEntity, account, inventories, kamis }}
              state={{ mode }}
              utils={utils}
            />
            <Transfer
              actions={{ sendItemsTx }}
              data={{ accountEntity, account, inventories }}
              state={{ lastRefresh, mode, resetSend, setResetSend }}
              utils={{ ...utils, setMode }}
            />
          </>
        )}
      </ModalWrapper>
    );
  },
};
