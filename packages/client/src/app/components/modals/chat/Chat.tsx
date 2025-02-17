import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { getAccount } from 'app/cache/account';
import { getKami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
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
            friends: 6,
            live: 1,
          };

          const { world, components } = network;
          return {
            data: { accountEntity, world, components },
            utils: {
              getAccount: (entity: EntityIndex) =>
                getAccount(world, components, entity, accountOptions),
              getRoomByIndex: (nodeIndex: number) => getRoomByIndex(world, components, nodeIndex),
              getEntityIndex: (entity: EntityID) => world.entityToIndex.get(entity)!,
              getKami: (entity: EntityIndex) => getKami(world, components, entity),
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
      const { getRoomByIndex, getAccount, getKami } = utils;
      const { modals } = useVisibility();

      const [messages, setMessages] = useState<KamiMessage[]>([]);
      const [blocked, setBlocked] = useState<EntityID[]>([]);
      const BlockedList: EntityID[] = [];
      const [account, setAccount] = useState<Account>(NullAccount); //0 Node
      //1 Feed
      const [activeTab, setActiveTab] = useState(0);

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
            <ModalHeader
              title={`${getRoomByIndex(account.roomIndex).name} ChatRoom`}
              icon={ChatIcon}
            />
          }
          footer={
            activeTab === 0 && (
              <InputRow actions={{ pushCast }} actionSystem={actions} api={api} world={world} />
            )
          }
          canExit
        >
          <Feed
            activeTab={activeTab}
            setActiveTab={setActiveTab}
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
