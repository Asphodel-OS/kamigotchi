import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";
import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';

import { Bio } from './Bio';
import { Tabs } from './Tabs';
import xIcon from 'assets/images/icons/placeholder.png';
import { ModalHeader, ModalWrapperFull } from 'layers/react/components/library';
import { registerUIComponent } from 'layers/react/engine/store';
import { Account, getAccountByIndex, getAccountFromBurner } from 'layers/react/shapes/Account';
import { useVisibility } from 'layers/react/store/visibility';
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

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          actions,
          api: { player },
          components: {
            OperatorAddress,
            OwnerAddress,
            IsAccount,
            IsPet,
            AccountID,
            HolderID,
            PetID,
            AccountIndex,
            ItemIndex,
            LastActionTime,
            LastTime,
            StartTime,
            Coin,
            Level,
            Location,
            MediaURI,
            Name,
            State,
          },
          world,
        },
      } = layers;

      return merge(
        OperatorAddress.update$,
        OwnerAddress.update$,
        IsAccount.update$,
        IsPet.update$,
        AccountID.update$,
        HolderID.update$,
        PetID.update$,
        AccountIndex.update$,
        ItemIndex.update$,
        LastTime.update$,
        LastActionTime.update$,
        StartTime.update$,
        Coin.update$,
        Level.update$,
        Location.update$,
        MediaURI.update$,
        Name.update$,
        State.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(
            layers,
            { inventory: true, kamis: true },
          );

          return {
            layers,
            actions,
            api: player,
            data: { account },
            world,
          };
        })
      );
    },

    ({ layers, actions, api }) => {
      // console.log('AccountM: data', data);
      const { modals, setModals } = useVisibility();
      const { accountIndex } = useSelected();
      const [account, setAccount] = useState<Account | null>(getAccountByIndex(layers, accountIndex));
      const [tab, setTab] = useState('party'); // party | friends | activity

      useEffect(() => {
        setAccount(getAccountByIndex(layers, accountIndex));
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
            return api.social.friend.request(account.ownerEOA);
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
            return api.social.friend.accept(account.ownerEOA);
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
        <ModalWrapperFull
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
        </ModalWrapperFull>

      );
    }
  );
}