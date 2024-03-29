import { EntityID } from '@mud-classic/recs';
import { map, merge } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { socialIcon } from 'assets/images/icons/menu';
import {
  Account,
  getAccountByID,
  getAccountByName,
  getAccountByOwner,
  getAccountFromBurner,
} from 'layers/network/shapes/Account';
import { Friendship, queryFriendshipX } from 'layers/network/shapes/Friendship';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';
import { Friends } from './Friends';

export function registerSocialModal() {
  registerUIComponent(
    'Social',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 55,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const { network } = layers;
      const {
        IsBonus,
        IsConfig,
        IsFriendship,
        AccountID,
        HolderID,
        TargetID,
        Balance,
        Name,
        State,
        Type,
        Value,
      } = network.components;

      return merge(
        IsBonus.update$,
        IsConfig.update$,
        IsFriendship.update$,
        AccountID.update$,
        HolderID.update$,
        TargetID.update$,
        Balance.update$,
        Name.update$,
        State.update$,
        Type.update$,
        Value.update$
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(network, { friends: true });

          return {
            network,
            data: { account },
          };
        })
      );
    },

    // Render
    ({ network, data }) => {
      const { actions, api, world } = network;

      /////////////////
      // ACTIONS

      // accept a friend request
      const acceptFriend = (friendship: Friendship) => {
        const actionID = uuidv4() as EntityID;
        actions.add({
          action: 'AcceptFriend',
          params: [friendship.id],
          description: `Accepting friend request from ${friendship.target.name}`,
          execute: async () => {
            return api.player.social.friend.accept(friendship.id);
          },
        });
      };

      // send a friend request
      const requestFriend = (target: Account) => {
        const actionID = uuidv4() as EntityID;
        actions.add({
          action: 'RequestFriend',
          params: [target.ownerEOA],
          description: `Sending friend request to ${target.name}`,
          execute: async () => {
            return api.player.social.friend.request(target.ownerEOA);
          },
        });
      };

      // block an account
      const blockFriend = (target: Account) => {
        const actionID = uuidv4() as EntityID;
        actions.add({
          action: 'BlockFriend',
          params: [target.ownerEOA],
          description: `Blocking ${target.name}`,
          execute: async () => {
            return api.player.social.friend.block(target.ownerEOA);
          },
        });
      };

      // cancel a friendship - a request, block, or friend
      const cancelFriend = (friendship: Friendship, actionText: string) => {
        const actionID = uuidv4() as EntityID;
        actions.add({
          action: 'CancelFriend',
          params: [friendship.id],
          description: actionText,
          execute: async () => {
            return api.player.social.friend.cancel(friendship.id);
          },
        });
      };

      /////////////////
      // QUERIES

      const queryAccount = (id: EntityID, options?: any): Account => {
        return getAccountByID(network, id, options);
      };

      const queryAccountByName = (name: string, options?: any): Account => {
        return getAccountByName(network, name, options);
      };

      const queryAccountByOwner = (ownerEOA: string, options?: any): Account => {
        return getAccountByOwner(network, ownerEOA, options);
      };

      const queryFriendships = (options: any, accountOptions?: any): Friendship[] => {
        return queryFriendshipX(
          network,
          { account: options.account?.id, target: options.target?.id, state: options.state },
          accountOptions
        );
      };

      return (
        <ModalWrapper
          id='social_modal'
          divName='social'
          header={<ModalHeader title='Social' icon={socialIcon} />}
          canExit
        >
          <Friends
            account={data.account}
            actions={{ acceptFriend, requestFriend, blockFriend, cancelFriend }}
            queries={{ queryAccount, queryAccountByName, queryAccountByOwner, queryFriendships }}
          />
        </ModalWrapper>
      );
    }
  );
}
