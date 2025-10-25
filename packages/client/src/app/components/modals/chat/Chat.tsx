import { EntityID, EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';

import { getAccount as _getAccount } from 'app/cache/account';
import { getItemByIndex as _getItemByIndex } from 'app/cache/item';
import { getKami as _getKami } from 'app/cache/kami';
import { getRoomByIndex as _getRoomByIndex } from 'app/cache/room';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/menu';
import { Message as KamiMessage } from 'clients/kamiden/proto';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { InputRow } from './InputRow';
import { Feed } from './feed/Feed';

// make sure to set your NEYNAR_API_KEY .env

export const ChatModal: UIComponent = {
  id: 'ChatModal',
  Render: () => {
    const layers = useLayers();

    const {
      data: { accountEntity, world, components },
      utils: { getAccount, getRoomByIndex, getEntityIndex, getKami, getItemByIndex },
      network,
    } = (() => {
      const { network } = layers;
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
            _getAccount(world, components, entity, accountOptions),
          getRoomByIndex: (nodeIndex: number) => _getRoomByIndex(world, components, nodeIndex),
          getEntityIndex: (entity: EntityID) => world.entityToIndex.get(entity)!,
          getKami: (entity: EntityIndex) => _getKami(world, components, entity),
          getItemByIndex: (itemIndex: number) => _getItemByIndex(world, components, itemIndex),
        },
        network,
      };
    })();

    const { actions, api } = network;
    const chatModalVisible = useVisibility((s) => s.modals.chat);

    const [messages, setMessages] = useState<KamiMessage[]>([]);
    const [blocked, setBlocked] = useState<EntityID[]>([]);
    const BlockedList: EntityID[] = [];
    const [account, setAccount] = useState<Account>(NullAccount); //0 Node
    //1 Feed
    const [activeTab, setActiveTab] = useState(0);

    // update data of the selected account when account index or data changes
    useEffect(() => {
      if (!chatModalVisible) return;
      // const accountEntity = queryAccountByIndex(components, accountIndex);
      const account = getAccount(accountEntity ?? (0 as EntityIndex));
      setAccount(account);
    }, [accountEntity, chatModalVisible]);
    //TODO
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

    return (
      <ModalWrapper
        id='chat'
        header={<ModalHeader title={`Chat`} icon={ChatIcon} />}
        footer={activeTab === 0 && <InputRow actionSystem={actions} api={api} world={world} />}
        canExit
      >
        <Feed
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          api={api}
          actionSystem={actions}
          blocked={blocked}
          utils={{
            getAccount,
            getRoomByIndex,
            getEntityIndex,
            getKami,
            getItemByIndex,
          }}
          player={account}
        />
      </ModalWrapper>
    );
  },
};
