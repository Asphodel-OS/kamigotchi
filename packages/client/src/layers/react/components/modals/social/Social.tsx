import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";
import React from 'react';
import { map, merge } from 'rxjs';

import { Friends } from './Friends';
import { socialIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { Account, getAccountByName, getAccountByOwner, getAccountFromBurner } from 'layers/react/shapes/Account';
import { Friendship, queryFriendshipX } from 'layers/react/shapes/Friendship';
import 'layers/react/styles/font.css';


export function registerSocialModal() {
  registerUIComponent(
    'Social',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 99,
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
            IsBonus,
            IsConfig,
            IsProduction,
            IsFriendship,
            AccountID,
            HolderID,
            PetID,
            ItemIndex,
            Balance,
            Coin,
            Harmony,
            Health,
            HealthCurrent,
            LastTime,
            Location,
            MediaURI,
            Name,
            Rate,
            StartTime,
            State,
            Type,
            Value,
          },
          world,
        },
      } = layers;

      return merge(
        OperatorAddress.update$,
        OwnerAddress.update$,
        IsAccount.update$,
        IsBonus.update$,
        IsConfig.update$,
        IsProduction.update$,
        IsFriendship.update$,
        AccountID.update$,
        HolderID.update$,
        PetID.update$,
        ItemIndex.update$,
        Balance.update$,
        Coin.update$,
        Harmony.update$,
        HealthCurrent.update$,
        Health.update$,
        LastTime.update$,
        Location.update$,
        MediaURI.update$,
        Name.update$,
        Rate.update$,
        StartTime.update$,
        State.update$,
        Type.update$,
        Value.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(
            layers,
            { friends: true },
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

    // Render
    ({ layers, actions, api, data, world }) => {
      /////////////////
      // ACTIONS

      // accept a friend request
      const acceptFriend = (friendship: Friendship) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'AcceptFriend',
          params: [friendship.id],
          description: `Accepting friend request from ${friendship.target.name}`,
          execute: async () => {
            return api.social.friend.accept(friendship.id);
          },
        });
      };

      // send a friend request
      const requestFriend = (target: Account) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'RequestFriend',
          params: [target.ownerEOA],
          description: `Sending friend request to ${target.name}`,
          execute: async () => {
            return api.social.friend.request(target.ownerEOA);
          },
        });
      };

      // block an account
      const blockFriend = (target: Account) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'BlockFriend',
          params: [target.ownerEOA],
          description: `Blocking ${target.name}`,
          execute: async () => {
            return api.social.friend.block(target.ownerEOA);
          },
        });
      };

      // cancel a friendship - a request, block, or friend
      const cancelFriend = (friendship: Friendship, actionText: string) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'CancelFriend',
          params: [friendship.id],
          description: actionText,
          execute: async () => {
            return api.social.friend.cancel(friendship.id);
          },
        });
      };

      /////////////////
      // QUERIES

      const queryAccountByName = (
        name: string,
        options?: any
      ): Account => {
        return getAccountByName(
          layers,
          name,
          options
        );
      }

      const queryAccountByOwner = (
        ownerEOA: string,
        options?: any
      ): Account => {
        return getAccountByOwner(
          layers,
          ownerEOA,
          options
        );
      }

      const queryFriendships = (
        options: any
      ): Friendship[] => {
        return queryFriendshipX(
          layers,
          options,
        );
      }

      return (
        <ModalWrapperFull
          id='social_modal'
          divName='social'
          header={<ModalHeader title='Social' icon={socialIcon} />}
          canExit
        >
          <Friends
            account={data.account}
            actions={{ acceptFriend, requestFriend, blockFriend, cancelFriend }}
            queries={{ queryAccountByName, queryAccountByOwner, queryFriendships }}
          />
        </ModalWrapperFull>
      );
    }
  );
}