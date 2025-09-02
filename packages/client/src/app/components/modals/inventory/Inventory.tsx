import {
  getAccount as _getAccount,
  getAccountInventories,
  getAccountKamis,
} from 'app/cache/account';
import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount } from 'app/stores';
import { InventoryIcon } from 'assets/images/icons/menu';
import { OBOL_INDEX } from 'constants/items';
import { Account, queryAccountFromEmbedded } from 'network/shapes/Account';
import { parseAllos as _parseAllos, Allo } from 'network/shapes/Allo';
import { parseConditionalText, passesConditions } from 'network/shapes/Conditional';
import { getMusuBalance as _getMusuBalance, getItemBalance, Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { ItemGrid } from './ItemGrid';
import { MusuRow } from './MusuRow';

export const InventoryModal: UIComponent = {
  id: 'Inventory',
  Render: () => {
    const layers = useLayers();
    const { debug } = useAccount();

    const {
      network,
      data: { accountEntity },
      utils: {
        getAccount,
        getInventories,
        getKamis,
        meetsRequirements,
        getMusuBalance,
        getObolsBalance,
        displayRequirements,
        parseAllos,
      },
    } = (() => {
      const { network } = layers;
      const { world, components } = network;
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
          getAccount: () => _getAccount(world, components, accountEntity),
          getInventories: () => getAccountInventories(world, components, accountEntity),
          getKamis: () =>
            getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
          meetsRequirements: (holder: Kami | Account, item: Item) =>
            passesConditions(world, components, item.requirements.use, holder),
          getMusuBalance: () => _getMusuBalance(world, components, accountEntity),
          getObolsBalance: () =>
            getItemBalance(world, components, world.entities[accountEntity], OBOL_INDEX),
          displayRequirements: (recipe: Item) =>
            recipe.requirements.use
              .map((req) => parseConditionalText(world, components, req))
              .join('\n '),
          parseAllos: (allo: Allo[]) => _parseAllos(world, components, allo),
        },
      };
    })();

    const { actions, api } = network;

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
            accountEntity={accountEntity}
            actions={{ useForAccount, useForKami }}
            utils={{
              getAccount,
              getInventories,
              getKamis,
              meetsRequirements,
              displayRequirements,
              parseAllos,
            }}
          />
        )}
      </ModalWrapper>
    );
  },
};
