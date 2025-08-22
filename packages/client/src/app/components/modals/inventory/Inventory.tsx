import { interval, map } from 'rxjs';

import { EntityIndex } from '@mud-classic/recs';
import { getAccount, getAccountInventories, getAccountKamis } from 'app/cache/account';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useAccount, useVisibility } from 'app/stores';
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
import { useEffect, useState } from 'react';
import { ItemGrid } from './ItemGrid';
import { MusuRow } from './MusuRow';

const REFRESH_INTERVAL = 1000;

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
            getAccount: (entity: EntityIndex) => getAccount(world, components, entity),
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

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [account, setAccount] = useState<Account>(NullAccount);
    const [tick, setTick] = useState(Date.now());
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
    }, [modals.inventory, tick]);

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
      const itemsIndexes = items.map((item) => item.index);
      const itemsNames = items.map((item) => item.name);
      const itemamts = items.map((item) => item.index);
      actions.add({
        action: 'ItemTransfer',
        params: [itemsIndexes, amts, account.id],
        description: `Sending ${itemamts} ${itemsNames} to ${account.name}`,
        execute: async () => {
          return api.player.account.item.transfer(itemsIndexes, [1], account.id);
        },
      });
    };

    /////////////////
    // DISPLAY

    return (
      <ModalWrapper
        id='inventory'
        header={<ModalHeader title='Inventory' icon={InventoryIcon} />}
        footer={<MusuRow key='musu' data={{ musu: getMusuBalance(), obols: getObolsBalance() }} />}
        canExit
        overlay
        truncate
      >
        {!accountEntity ? (
          <EmptyText text={['Failed to Connect Account']} size={1} />
        ) : (
          <ItemGrid
            key='grid'
            accounts={accounts}
            accountEntity={accountEntity}
            actions={{ useForAccount, useForKami, sendItemsTx }}
            utils={utils}
          />
        )}
      </ModalWrapper>
    );
  },
};
