import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { getAccount } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/menu';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';

import { getRoomByIndex } from 'app/cache/room';
import { InputRow } from './InputRow';
import { Feed } from './feed/Feed';

// make sure to set your NEYNAR_API_KEY .env

export function registerChatModal() {
  registerUIComponent(
    'ChatModal',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 75,
    },

    // Requirement
    (layers) => {
      const { network } = layers;
      return interval(3333).pipe(
        map(() => {
          const accountEntity = queryAccountFromEmbedded(network);
          const accountOptions = {
            friends: 60,
          };

          const { world, components } = network;
          return {
            data: { accountEntity, world, components },
            utils: {
              getAccount: (entity: EntityIndex) =>
                getAccount(world, components, entity, accountOptions),
              getRoomByIndex: (nodeIndex: number) => getRoomByIndex(world, components, nodeIndex),
              getEntityIndex: (entity: EntityID) => world.entityToIndex.get(entity)!,
            },
            network,
            world,
          };
        })
      );
    },
    ({ data, network, utils, world }) => {
      const { accountEntity } = data;
      const { actions, api } = network;
      const { getRoomByIndex, getAccount } = utils;
      const { modals } = useVisibility();
      const { nodeIndex } = useSelected.getState();

      const [messages, setMessages] = useState<KamiMessage[]>([]);
      const [blocked, setBlocked] = useState<EntityID[]>([]);
      const BlockedList: EntityID[] = [];
      const [account, setAccount] = useState<Account>(NullAccount);

      // update data of the selected account when account index or data changes
      useEffect(() => {
        if (!modals.chat) return;
        // const accountEntity = queryAccountByIndex(components, accountIndex);
        const account = getAccount(accountEntity ?? (0 as EntityIndex));
        setAccount(account);
      }, [accountEntity, modals.chat]);

      useEffect(() => {
        if (account.friends?.blocked) {
          account.friends?.blocked.forEach((blockedFren) => {
            BlockedList.push(blockedFren.target.id);
          });
          setBlocked(BlockedList);
        } else {
          setBlocked([]);
        }
      }, [account.friends?.blocked]);

      const pushCast = (cast: CastWithInteractions) => {};

      const pushMessages = (newMessages: KamiMessage[]) => {};

      return (
        <ModalWrapper
          id='chat'
          header={
            <ModalHeader title={`${getRoomByIndex(nodeIndex).name} ChatRoom`} icon={ChatIcon} />
          }
          footer={
            <InputRow actions={{ pushCast }} actionSystem={actions} api={api} world={world} />
          }
          canExit
        >
          <Feed
            api={api}
            actionSystem={actions}
            blocked={blocked}
            utils={utils}
            player={account}
            actions={{ pushMessages, setMessages }}
          />
        </ModalWrapper>
      );
    }
  );
}
