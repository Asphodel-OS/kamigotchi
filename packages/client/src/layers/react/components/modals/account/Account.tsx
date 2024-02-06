import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";
import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { Bio } from './Bio';
import { Bottom } from './Bottom';
import { Tabs } from './Tabs';
import { operatorIcon } from 'assets/images/icons/menu';
import { ModalHeader, ModalWrapper } from 'layers/react/components/library';
import {
  Account,
  getAccountByIndex,
  getAccountFromBurner,
  getAllAccounts
} from 'layers/network/shapes/Account';
import { Friendship } from 'layers/network/shapes/Friendship';
import { useSelected } from 'layers/react/store/selected';
import { registerUIComponent } from 'layers/react/engine/store';


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
    (layers) => interval(3333).pipe(map(() => {
      const account = getAccountFromBurner(
        layers.network,
        { friends: true, inventory: true, kamis: true, stats: true },
      );

      return {
        network: layers.network,
        data: { account },
      };
    })),

    // Render
    ({ network, data }) => {
      // console.log('AccountM: data', data);
      const { actions, api } = network;
      const { accountIndex } = useSelected();
      const [account, setAccount] = useState<Account | null>(getAccountByIndex(network, accountIndex));
      const [tab, setTab] = useState('party'); // party | frens | activity | requests | blocked

      useEffect(() => {
        const accountOptions = { friends: true, inventory: true, kamis: true, stats: true };
        setAccount(getAccountByIndex(network, accountIndex, accountOptions));
      }, [accountIndex, data.account]);


      /////////////////
      // INTERACTION

      const acceptFren = (friendship: Friendship) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
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
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
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
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
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
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
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
            account={account}
            actions={{ sendRequest: requestFren, acceptRequest: acceptFren }} />
          <Tabs tab={tab} setTab={setTab} isSelf={data.account.index === account.index} />
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