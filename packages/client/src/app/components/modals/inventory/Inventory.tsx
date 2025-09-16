import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { useEffect, useState } from 'react';

import {
  getAccount as _getAccount,
  getAccountInventories,
  getAccountKamis,
} from 'app/cache/account';
import {
  getInventoryBalance as _getInventoryBalance,
  cleanInventories,
  Inventory,
} from 'app/cache/inventory';
import { getItemByIndex } from 'app/cache/item';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { InventoryIcon } from 'assets/images/icons/menu';
import { MUSU_INDEX, OBOL_INDEX } from 'constants/items';
import {
  queryAllAccounts as _queryAllAccounts,
  Account,
  NullAccount,
  queryAccountFromEmbedded,
} from 'network/shapes/Account';
import { parseAllos as _parseAllos, Allo } from 'network/shapes/Allo';
import { parseConditionalText, passesConditions } from 'network/shapes/Conditional';
import { getItemBalance, Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { didActionComplete } from 'network/utils';
import { ItemGrid } from './items/ItemGrid';
import { MusuRow } from './MusuRow';
import { Transfer } from './transfer/Transfer';
import { Mode, REFRESH_INTERVAL } from './types';

export const InventoryModal: UIComponent = {
  id: 'Inventory',
  Render: () => {
    const layers = useLayers();
    const { debug } = useAccount.getState();

    /////////////////
    // PREPARATION

    const { network, data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const accountID = world.entities[accountEntity];

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
          getAccount: (entity: EntityIndex) => _getAccount(world, components, entity),
          getEntityIndex: (entity: EntityID) => world.entityToIndex.get(entity)!,
          getInventories: () => getAccountInventories(world, components, accountEntity),
          getBalance: (invs: Inventory[], index: number) => _getInventoryBalance(invs, index),
          getItem: (index: EntityIndex) => getItemByIndex(world, components, index),
          getKamis: () =>
            getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
          getMusuBalance: () => getItemBalance(world, components, accountID, MUSU_INDEX),
          getObolsBalance: () => getItemBalance(world, components, accountID, OBOL_INDEX),
          meetsRequirements: (holder: Kami | Account, item: Item) =>
            passesConditions(world, components, item.requirements.use, holder),
          parseAllos: (allo: Allo[]) => _parseAllos(world, components, allo),
          queryAllAccounts: () => _queryAllAccounts(components),
        },
      };
    })();
    const { actions, api } = network;
    const { accountEntity } = data;
    const { getAccount, getInventories, getKamis } = utils;
    const { getItem, getBalance } = utils;

    const [tick, setTick] = useState(Date.now());
    const [mode, setMode] = useState<Mode>('STOCK');
    const [shuffle, setShuffle] = useState(false);
    const [resetSend, setResetSend] = useState(false);

    const [account, setAccount] = useState<Account>(NullAccount);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [kamis, setKamis] = useState<Kami[]>([]);

    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const inventoryModalOpen = useVisibility((s) => s.modals.inventory);

    /////////////////
    // SUBSCRIPTIONS

    // set data and setup ticking on mount
    useEffect(() => {
      updateData();
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
      return () => clearInterval(timerId);
    }, []);

    // refresh data whenever the modal is opened
    useEffect(() => {
      if (!inventoryModalOpen) return;
      updateData();
    }, [inventoryModalOpen, tick, accountEntity]);

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
              musu: getBalance(account.inventories ?? [], MUSU_INDEX),
              obols: getBalance(account.inventories ?? [], OBOL_INDEX),
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
              state={{ tick, mode, resetSend, setResetSend }}
              utils={utils}
            />
          </>
        )}
      </ModalWrapper>
    );
  },
};
