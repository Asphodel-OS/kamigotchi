import { EntityID } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { getInventoryBalance, Inventory } from 'app/cache/inventory';
import { getItemByIndex } from 'app/cache/item';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { KamiIcon } from 'assets/images/icons/menu';
import { HOLY_DUST_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item, NullItem } from 'network/shapes/Item';
import { Kami, NullKami } from 'network/shapes/Kami';
import { Carousel } from './Carousel';
import { Stage } from './Stage';

const REFRESH_INTERVAL = 2000;

export const EmaBoardModal: UIComponent = {
  id: 'EmaBoardModal',
  requirement: (layers) =>
    interval(1000).pipe(
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
            getAccount: () =>
              getAccount(world, components, accountEntity, { live: 2, inventory: 2 }),
            getKamis: () =>
              getAccountKamis(world, components, accountEntity, {
                base: 2,
                live: 2,
                progress: 3600,
              }),
            getItemBalance: (inventory: Inventory[], index: number) =>
              getInventoryBalance(inventory, index),
            getItem: (index: number) => getItemByIndex(world, components, index),
          },
        };
      })
    ),
  Render: ({ network, data, utils }) => {
    const { accountEntity } = data;
    const { actions, api } = network;
    const { getAccount, getItem, getKamis } = utils;
    const emaBoardVisible = useVisibility((s) => s.modals.emaBoard);

    const [tick, setTick] = useState(Date.now());
    const [kamis, setKamis] = useState<Kami[]>([]);
    const [account, setAccount] = useState<Account>(NullAccount);
    const [selected, setSelected] = useState<Kami>(NullKami);
    const [holyDustItem, setHolyDustItem] = useState<Item>(NullItem);

    /////////////////
    // SUBSCRIPTIONS

    useEffect(() => {
      setHolyDustItem(getItem(HOLY_DUST_INDEX));

      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
      return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
      if (!emaBoardVisible) return;
      setAccount(getAccount());
      setKamis(getKamis());
    }, [emaBoardVisible, accountEntity, tick]);

    /////////////////
    // ACTIONS

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

    return (
      <ModalWrapper
        id='emaBoard'
        header={<ModalHeader title='Ema Board' icon={KamiIcon} />}
        canExit
        noPadding
        truncate
      >
        <Stage
          actions={{ rename: renameTx }}
          data={{ account, kami: selected, holyDustItem }}
          state={{ tick }}
          utils={utils}
        />
        <Carousel kamis={kamis} state={{ selected, setSelected }} />
      </ModalWrapper>
    );
  },
};
