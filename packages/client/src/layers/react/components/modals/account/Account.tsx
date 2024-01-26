import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";
import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { Bio } from './Bio';
import { Tabs } from './Tabs';
import xIcon from 'assets/images/icons/placeholder.png';
import { ModalHeader, ModalWrapper } from 'layers/react/components/library';
import { registerUIComponent } from 'layers/react/engine/store';
import { Account, getAccountByIndex, getAccountFromBurner } from 'layers/network/shapes/Account';
import { useSelected } from 'layers/react/store/selected';
import 'layers/react/styles/font.css';


export function registerAccountModal() {
  registerUIComponent(
    'AccountModal',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 50,
    },

    // Requirement
    (layers) => interval(1000).pipe(map(() => {
      const account = getAccountFromBurner(
        layers.network,
        { inventory: true, kamis: true },
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
      const [tab, setTab] = useState('party'); // party | friends | activity

      useEffect(() => {
        setAccount(getAccountByIndex(network, accountIndex));
      }, [accountIndex]);



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

      // NOTE: unused atm, may use if modal layout changes
      const Header = () => {
        if (!account) return <div />;
        return ([
          <Bio
            account={account}
            actions={{ sendRequest: requestFren, acceptRequest: acceptFren }} />,
          < Tabs tab={tab} setTab={setTab} />
        ]);
      }

      return (
        <ModalWrapper
          id='account_modal'
          divName='account'
          header={<ModalHeader title='Operator' icon={xIcon} />}
          canExit
        >
          {account &&
            <Bio
              account={account}
              actions={{ sendRequest: requestFren, acceptRequest: acceptFren }} />
          }
        </ModalWrapper>

      );
    }
  );
}