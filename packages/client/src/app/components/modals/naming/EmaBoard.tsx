import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { EntityID } from '@mud-classic/recs';
import { getAccount, getAccountKamis } from 'app/cache/account';
import { getInventoryBalance, Inventory } from 'app/cache/inventory';
import { getItemByIndex } from 'app/cache/item';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork, useVisibility } from 'app/stores';
import { BalPair, useTokens } from 'app/stores/tokens';
import { KamiIcon } from 'assets/images/icons/menu';
import { HOLY_DUST_INDEX, ONYX_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item, NullItem } from 'network/shapes/Item';
import { Kami, NullKami } from 'network/shapes/Kami';
import { getCompAddr } from 'network/shapes/utils';
import { useEffect, useState } from 'react';
import { Carousel } from './Carousel';
import { Stage } from './Stage';

const REFRESH_INTERVAL = 2000;
const PRICE = 5;

export function registerEMABoardModal() {
  registerUIComponent(
    'EmaBoard',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 3,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntity = queryAccountFromEmbedded(network);

          return {
            network,
            data: {
              accountEntity,
              spender: getCompAddr(world, components, 'component.token.allowance'),
            },
            utils: {
              getAccount: () =>
                getAccount(world, components, accountEntity, { live: 2, inventory: 2 }),
              getKamis: () => getAccountKamis(world, components, accountEntity, { live: 2 }),
              getDustBalance: (inventory: Inventory[]) =>
                getInventoryBalance(inventory, HOLY_DUST_INDEX),
              getItem: (index: number) => getItemByIndex(world, components, index),
            },
          };
        })
      ),

    // Render
    ({ network, data, utils }) => {
      const { accountEntity, spender } = data;
      const { actions, api } = network;
      const { getKamis, getAccount, getItem, getDustBalance } = utils;
      const { selectedAddress, apis: ownerAPIs } = useNetwork();
      const { balances: tokenBals } = useTokens();
      const { modals, setModals } = useVisibility();

      const [tick, setTick] = useState(Date.now());
      const [kamis, setKamis] = useState<any[]>([]);
      const [account, setAccount] = useState<Account>(NullAccount);
      const [selected, setSelected] = useState<Kami>(NullKami);
      const [onyxItem, setOnyxItem] = useState<Item>(NullItem);
      const [onyxInfo, setOnyxInfo] = useState<BalPair>({ allowance: 0, balance: 0 });

      /////////////////
      // SUBSCRIPTIONS

      useEffect(() => {
        setOnyxItem(getItem(ONYX_INDEX));

        const refreshClock = () => setTick(Date.now());
        const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
        return () => clearInterval(timerId);
      }, []);

      useEffect(() => {
        if (!modals.emaBoard) return;
        setAccount(getAccount());
        setKamis(getKamis());
      }, [modals.emaBoard, accountEntity, tick]);

      useEffect(() => {
        const onyxInfo = tokenBals.get(onyxItem.address!);
        setOnyxInfo(onyxInfo ?? { allowance: 0, balance: 0 });
      }, [onyxItem, spender, tick]);

      /////////////////
      // ACTIONS

      // approve the spend of an ERC20 token
      const approveOnyxTx = (amt: number) => {
        const api = ownerAPIs.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Approve token',
          params: [onyxItem.address, spender, amt],
          description: `Approve ${amt} ${onyxItem.name} to be spent`,
          execute: async () => {
            return api.erc20.approve(onyxItem.address!, spender, amt);
          },
        });
        return actionID;
      };

      const renameTx = (kami: Kami, name: string) => {
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'KamiName',
          params: [kami.id, name],
          description: `Renaming ${kami.name} to ${name}`,
          execute: async () => {
            return api.player.pet.name(kami.id, name);
          },
        });
        return actionID;
      };

      const onyxRenameTx = (kami: Kami, name: string) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'KamiOnyxRename',
          params: [kami.id, name],
          description: `Renaming ${kami.name} to ${name} with ONYX`,
          execute: async () => {
            return api.player.pet.onyx.rename(kami.id, name);
          },
        });
        return actionID;
      };

      return (
        <ModalWrapper
          id='emaBoard'
          header={<ModalHeader title='Ema Board' icon={KamiIcon} />}
          canExit
          noPadding
        >
          <Stage
            actions={{ onyxApprove: approveOnyxTx, rename: renameTx, onyxRename: onyxRenameTx }}
            data={{ account, kami: selected }}
          />
          <Carousel kamis={kamis} state={{ setSelected }} />
        </ModalWrapper>
      );
    }
  );
}
