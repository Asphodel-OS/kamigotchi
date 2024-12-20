import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { EntityIndex } from '@mud-classic/recs';
import { getAccount, getAccountKamis } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useSelected, useVisibility } from 'app/stores';
import { OperatorIcon } from 'assets/images/icons/menu';
import {
  Account,
  BaseAccount,
  getAllBaseAccounts,
  NullAccount,
  queryAccountByIndex,
} from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import { Bottom } from './Bottom';
import { Tabs } from './Tabs';
import { Bio } from './bio/Bio';

export function registerAccountModal() {
  registerUIComponent(
    'AccountModal',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 99,
    },

    // Requirement
    (layers) => {
      const { network } = layers;
      const { world, components } = network;

      const accountOptions = {
        friends: 60,
        stats: 60,
      };

      return interval(3333).pipe(
        map(() => {
          return {
            network,
            utils: {
              getAccount: (entity: EntityIndex) =>
                getAccount(world, components, entity, accountOptions),
              getAccountKamis: (accEntity: EntityIndex) =>
                getAccountKamis(world, components, accEntity),
            },
          };
        })
      );
    },
    // Render
    ({ network, utils }) => {
      const { actions, api, components, world } = network;
      const { getAccount } = utils;

      const { account: player } = useAccount();
      const { accountIndex } = useSelected();
      const { modals } = useVisibility();

      const [tab, setTab] = useState('frens'); // party | frens | activity | requests | blocked
      const [account, setAccount] = useState<Account>(NullAccount);

      // update data of the selected account when account index or data changes
      useEffect(() => {
        if (!modals.account) return;
        const accountEntity = queryAccountByIndex(components, accountIndex);
        const account = getAccount(accountEntity ?? (0 as EntityIndex));
        setAccount(account);
      }, [accountIndex, modals.account]);

      // set the default tab when account index switches
      useEffect(() => {
        if (isSelf()) setTab('frens');
        else setTab('party');
      }, [accountIndex]);

      const isSelf = () => {
        return player.index === accountIndex;
      };

      /////////////////
      // INTERACTION

      const acceptFren = (friendship: Friendship) => {
        actions.add({
          action: 'AcceptFriend',
          params: [friendship.id],
          description: `Accepting ${friendship.account.name} Friend Request`,
          execute: async () => {
            return api.player.social.friend.accept(friendship.id);
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
            return api.player.social.friend.block(account.ownerAddress);
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
            return api.player.social.friend.cancel(friendship.id);
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
            return api.player.social.friend.request(account.ownerAddress);
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
          header={<ModalHeader key='header' title='Friends' icon={OperatorIcon} />}
          canExit
          truncate
        >
          <Bio
            key='bio'
            account={account} // account selected for viewing
            isSelf={isSelf()}
            actionSystem={actions}
            actions={{ sendRequest: requestFren, acceptRequest: acceptFren }}
          />
          <Tabs tab={tab} setTab={setTab} isSelf={isSelf()} />
          <Bottom
            key='bottom'
            tab={tab}
            data={{
              account,
              getAllAccs: () => getAllBaseAccounts(world, components),
            }}
            actions={{ acceptFren, blockFren, cancelFren, requestFren }}
            utils={utils}
          />
        </ModalWrapper>
      );
    }
  );
}
