import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useSelected, useVisibility } from 'app/stores';
import { operatorIcon } from 'assets/images/icons/menu';
import {
  Account,
  BaseAccount,
  getAccountByIndex,
  getAllBaseAccounts,
  NullAccount,
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

      return interval(3333).pipe(
        map(() => {
          return {
            network,
          };
        })
      );
    },
    // Render
    ({ network }) => {
      const { actions, api, components, world } = network;
      const { account: player } = useAccount();
      const { accountIndex } = useSelected();
      const { modals } = useVisibility();

      const [account, setAccount] = useState<Account>(NullAccount);
      const [tab, setTab] = useState('frens'); // party | frens | activity | requests | blocked

      // update data of the selected account when account index or data changes
      useEffect(() => {
        if (!modals.account) return;
        const accountOptions = {
          friends: true,
          inventory: true,
          kamis: true,
          stats: true,
        };
        setAccount(getAccountByIndex(world, components, accountIndex, accountOptions));
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
          params: [account.ownerEOA],
          description: `Blocking ${account.name}`,
          execute: async () => {
            return api.player.social.friend.block(account.ownerEOA);
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
          params: [account.ownerEOA],
          description: `Sending ${account.name} Friend Request`,
          execute: async () => {
            return api.player.social.friend.request(account.ownerEOA);
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
          header={<ModalHeader key='header' title='Friends' icon={operatorIcon} />}
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
          />
        </ModalWrapper>
      );
    }
  );
}
