import { uuid } from '@mud-classic/utils';
import { EntityID, EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';

import {
  getAccount as _getAccount,
  getAccountKamis as _getAccountKamis,
  Account,
  getAllAccounts,
} from 'app/cache/account';
import { getFriends as _getFriends } from 'app/cache/account/getters';
import { getConfigAddress } from 'app/cache/config';
import { getKami as _getKami, Kami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useSelected, useVisibility } from 'app/stores';
import { OperatorIcon } from 'assets/images/icons/menu';
import { BaseAccount, NullAccount, queryAccountByIndex } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import { queryKamiByIndex as _queryKamiByIndex } from 'network/shapes/Kami';
import { getTotalScoreByFilter, getVIPEpoch } from 'network/shapes/Score';
import { getCompAddr } from 'network/shapes/utils';
import { waitForActionCompletion } from 'network/utils';
import { Bottom } from './bottom/Bottom';
import { Header } from './header/Header';
import { Tabs } from './tabs/Tabs';

export const AccountModal: UIComponent = {
  id: 'AccountModal',
  Render: () => {
    const layers = useLayers();

    const {
      network,
      data: { vip, kamiNFTAddress, spender },
      utils: { getAccount, getAccountKamis, getFriends, getKami, queryKamiByIndex },
    } = (() => {
      const { network } = layers;
      const { world, components } = network;

      const accountOptions = {
        friends: 5,
        pfp: 5,
        stats: 5,
        bio: 5,
      };

      const vipEpoch = getVIPEpoch(world, components);
      const vipFilter = { epoch: vipEpoch, index: 0, type: 'VIP_SCORE' };
      const kamiRefreshOptions = {
        live: 0,
        bonuses: 5, // set this to 3600 once we get explicit triggers for updates
        harvest: 5, // set this to 60 once we get explicit triggers for updates
        progress: 5,
        skills: 5, // set this to 3600 once we get explicit triggers for updates
        flags: 10, // set this to 3600 once we get explicit triggers for updates
        config: 3600,
        stats: 3600,
        traits: 3600,
        state: 5,
      };

      return {
        network,
        data: {
          kamiNFTAddress: getConfigAddress(world, components, 'KAMI721_ADDRESS'),
          spender: getCompAddr(world, components, 'component.token.allowance'),
          vip: {
            epoch: vipEpoch,
            total: getTotalScoreByFilter(world, components, vipFilter),
          },
        },
        utils: {
          getAccount: (entity: EntityIndex) =>
            _getAccount(world, components, entity, accountOptions),
          getAccountKamis: (accEntity: EntityIndex) =>
            _getAccountKamis(world, components, accEntity),
          getFriends: (accEntity: EntityIndex) => _getFriends(world, components, accEntity),
          queryKamiByIndex: (index: number) => _queryKamiByIndex(world, components, index),
          getKami: (entity: EntityIndex) => _getKami(world, components, entity, kamiRefreshOptions),
        },
      };
    })();

    const { actions, api, components, world } = network;
    const { account: player } = useAccount();
    const accountIndex = useSelected((s) => s.accountIndex);
    const accountModalVisible = useVisibility((s) => s.modals.account);
    const { selectedAddress, apis } = useNetwork();

    const [subTab, setSubTab] = useState('frens'); //  frens | requests | blocked
    const [tab, setTab] = useState('stats'); //  social | party | stats
    const [account, setAccount] = useState<Account>(NullAccount);
    const [isSelf, setIsSelf] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);

    /////////////////
    // SUBSCRIPTIONS

    useEffect(() => {
      setAccounts(getAllAccounts(world, components));
    }, []);

    // update data of the selected account when account index or data changes
    useEffect(() => {
      if (!accountModalVisible) return;
      const accountEntity = queryAccountByIndex(components, accountIndex);
      const account = getAccount(accountEntity ?? (0 as EntityIndex));
      setAccount(account);
    });

    // set the default subtab and tab when account index switches or modal is closed
    useEffect(() => {
      const isSelf = player.index === accountIndex;
      setIsSelf(isSelf);
      if (isSelf) setSubTab('frens');
      setTab('stats');
    }, [accountIndex, accountModalVisible]);

    /////////////////
    // INTERACTION

    const acceptFren = (friendship: Friendship) => {
      actions.add({
        action: 'AcceptFriend',
        params: [friendship.id],
        description: `Accepting ${friendship.account.name} Friend Request`,
        execute: async () => {
          return api.player.account.friend.accept(friendship.id);
        },
      });
    };

    // block an account
    const blockFren = (account: BaseAccount) => {
      actions.add({
        action: 'BlockFriend',
        params: [account.ownerAddress],
        description: `Blocking ${account.name}`,
        execute: async () => {
          return api.player.account.friend.block(account.ownerAddress);
        },
      });
    };

    // cancel a friendship - a request, block, or existing friendship
    const cancelFren = (friendship: Friendship) => {
      actions.add({
        action: 'CancelFriend',
        params: [friendship.id],
        description: `Cancelling ${friendship.target.name} Friendship`,
        execute: async () => {
          return api.player.account.friend.cancel(friendship.id);
        },
      });
    };

    // send a friend request
    const requestFren = (account: BaseAccount) => {
      actions.add({
        action: 'RequestFriend',
        params: [account.ownerAddress],
        description: `Sending ${account.name} Friend Request`,
        execute: async () => {
          return api.player.account.friend.request(account.ownerAddress);
        },
      });
    };

    const pfpTx = (kamiID: EntityID) => {
      if (!api) return console.error(`API not established for ${selectedAddress}`);
      const actionID = uuid() as EntityID;
      actions!.add({
        id: actionID,
        action: 'UpdatePfp',
        params: [kamiID],
        description: `Updating account pfp.`,
        execute: async () => {
          return api.player.account.set.pfp(kamiID);
        },
      });
      return actionID;
    };

    const handlePfpChange = async (kami: Kami) => {
      try {
        setIsLoading(true);
        const pfpTxActionID = pfpTx(kami.id);
        if (!pfpTxActionID) {
          setIsLoading(false);
          throw new Error('Pfp change action failed');
        }
        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(pfpTxActionID) as EntityIndex
        );
        setIsLoading(false);
      } catch (e) {
        setIsLoading(false);
        console.log('Bio.tsx: handlePfpChange()  failed', e);
      }
    };

    const setBio = async (bio: string) => {
      actions.add({
        action: 'AccountSetBio',
        params: [bio],
        description: `Setting account bio`,
        execute: async () => {
          return api.player.account.set.bio(bio);
        },
      });
    };
    /////////////////
    // RENDERING

    // this is just a placeholder until data loads
    if (!account) return <div />;

    return (
      <ModalWrapper
        id='account'
        header={<ModalHeader key='header' title='Account' icon={OperatorIcon} />}
        canExit
        truncate
      >
        <Header
          key='header'
          account={account} // account selected for viewing
          actions={{ handlePfpChange, setBio, requestFren, cancelFren, blockFren, acceptFren }}
          isLoading={isLoading}
          isSelf={isSelf}
          player={player}
          utils={{
            getAccountKamis,
            getFriends,
          }}
        />
        <Tabs tab={tab} setTab={setTab} isSelf={isSelf} />
        <Bottom
          key='bottom'
          actions={{
            acceptFren,
            blockFren,
            cancelFren,
            requestFren,
          }}
          data={{
            accounts,
            account,
            vip,
            player,
            isSelf,
            kamiNFTAddress,
          }}
          utils={{
            getAccountKamis,
            getFriends,
            queryKamiByIndex,
            getKami,
          }}
          view={{
            isSelf,
            setSubTab,
            subTab,
            tab,
          }}
        />
      </ModalWrapper>
    );
  },
};
