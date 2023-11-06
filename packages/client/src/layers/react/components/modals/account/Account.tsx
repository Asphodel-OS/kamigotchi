import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { operatorIcon } from 'assets/images/icons/menu';
import {
  Account,
  getAccountByIndex,
  getAccountFromBurner,
  getAllAccounts,
} from 'layers/network/shapes/Account';
import { Friendship } from 'layers/network/shapes/Friendship';
import { ModalHeader, ModalWrapper } from 'layers/react/components/library';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected } from 'layers/react/store/selected';
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
      rowEnd: 75,
    },

    // Requirement
    (layers) =>
      interval(3333).pipe(
        map(() => {
          const account = getAccountFromBurner(layers.network, {
            friends: true,
            inventory: true,
            kamis: true,
            stats: true,
          });

          return {
            network: layers.network,
            data: { account },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      // console.log('AccountM: data', data);
      const { actions, api } = network;
      const { accountIndex } = useSelected();
      const [account, setAccount] = useState<Account | null>(
        getAccountByIndex(network, accountIndex)
      );
      const [tab, setTab] = useState('frens'); // party | frens | activity | requests | blocked

      // update data of the selected account when account index or data changes
      useEffect(() => {
        const accountOptions = {
          friends: true,
          inventory: true,
          kamis: true,
          stats: true,
        };
        setAccount(getAccountByIndex(network, accountIndex, accountOptions));
      }, [accountIndex, data.account]);

      // set the default tab when account index switches
      useEffect(() => {
        if (isSelf()) setTab('frens');
        else setTab('party');
      }, [accountIndex]);

      const isSelf = () => {
        return data.account.index === accountIndex;
      };

      /////////////////
      // INTERACTION

      const acceptFren = (friendship: Friendship) => {
        actions?.add({
          action: 'AcceptFriend',
          params: [friendship.id],
          description: `Accepting ${friendship.account.name} Friend Request`,
          execute: async () => {
            return api.player.social.friend.accept(friendship.id);
          },
        });
      };

      // block an account
      const blockFren = (account: Account) => {
        actions?.add({
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
        actions?.add({
          action: 'CancelFriend',
          params: [friendship.id],
          description: `Cancelling ${friendship.target.name} Friendship`,
          execute: async () => {
            return api.player.social.friend.cancel(friendship.id);
          },
        });
      };

      // send a friend request
      const requestFren = (account: Account) => {
        actions?.add({
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
          key='modal-wrapper'
          id='account_modal'
          divName='account'
          header={<ModalHeader key='header' title='Operator' icon={operatorIcon} />}
          canExit
        >
          <Bio
            key='bio'
            account={account} // account selected for viewing
            playerAccount={data.account} // account of the player
            actions={{ sendRequest: requestFren, acceptRequest: acceptFren }}
          />
          <Tabs tab={tab} setTab={setTab} isSelf={isSelf()} />
          <Bottom
            key='bottom'
            tab={tab}
            data={{
              account,
              accounts: getAllAccounts(network),
            }}
            actions={{ acceptFren, blockFren, cancelFren, requestFren }}
          />
        </ModalWrapper>
      );
    }
  );
}
