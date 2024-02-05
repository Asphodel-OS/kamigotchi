import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";
import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { Bio } from './Bio';
import { Bottom } from './Bottom';
import { Tabs } from './Tabs';
import { operatorIcon } from 'assets/images/icons/menu';
import { ModalHeader, ModalWrapper } from 'layers/react/components/library';
import { Account, getAccountByIndex, getAccountFromBurner } from 'layers/network/shapes/Account';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected } from 'layers/react/store/selected';


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
      console.log('AccountM: data', data);
      const { actions, api } = network;
      const { accountIndex } = useSelected();
      const [account, setAccount] = useState<Account | null>(getAccountByIndex(network, accountIndex));
      const [tab, setTab] = useState('party'); // party | frens | activity

      useEffect(() => {
        const accountOptions = { friends: true, inventory: true, kamis: true, stats: true };
        setAccount(getAccountByIndex(network, accountIndex, accountOptions));
      }, [accountIndex, data.account]);



      /////////////////
      // INTERACTION

      // feed a kami
      const requestFren = (account: Account) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'FriendRequest',
          params: [account.ownerEOA],
          description: `Sending ${account.name} Friend Request`,
          execute: async () => {
            return api.player.social.friend.request(account.ownerEOA);
          },
        });
      };

      // NOTE: does not work, params wrong
      // TODO: update this to take the requestID as input?
      const acceptFren = (account: Account) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'FriendRequest',
          params: [account.ownerEOA],
          description: `Accepting ${account.name} Friend Request`,
          execute: async () => {
            return api.player.social.friend.accept(account.ownerEOA);
          },
        });
      };

      // this is just a placeholder until data loads
      if (!account) return <div />;

      return (
        <ModalWrapper
          id='account_modal'
          divName='account'
          header={<ModalHeader title='Operator' icon={operatorIcon} />}
          canExit
        >
          <Bio
            account={account}
            actions={{ sendRequest: requestFren, acceptRequest: acceptFren }} />
          <Tabs tab={tab} setTab={setTab} />
          <Bottom
            tab={tab}
            data={{ account }}
            actions={{ sendRequest: requestFren, acceptRequest: acceptFren }}
          />
        </ModalWrapper>

      );
    }
  );
}