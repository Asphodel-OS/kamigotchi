import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { BigNumberish } from 'ethers';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { Account, getAccount, getAccountKamis } from 'app/cache/account';
import { Kami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork, useSelected, useVisibility } from 'app/stores';
import { OperatorIcon } from 'assets/images/icons/menu';
import {
  BaseAccount,
  getAllBaseAccounts,
  NullAccount,
  queryAccountByIndex,
} from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import { waitForActionCompletion } from 'network/utils';
import { Bio } from './bio/Bio';
import { Bottom } from './bottom/Bottom';
import { Tabs } from './tabs/Tabs';

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
        friends: 5,
        pfp: 5,
        stats: 5,
      };
      // TODO: reduce update frequency
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
      const { selectedAddress, apis } = useNetwork();
      const [subTab, setSubTab] = useState('frens'); //  frens | requests | blocked
      const [tab, setTab] = useState('stats'); //  social | party | stats
      const [account, setAccount] = useState<Account>(NullAccount);
      const [isSelf, setIsSelf] = useState(false);
      const [isLoading, setIsLoading] = useState(false);

      // update data of the selected account when account index or data changes
      useEffect(() => {
        if (!modals.account) return;
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
      }, [accountIndex, modals.account]);

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

      const pfpTx = (kamiID: BigNumberish) => {
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
          <Bio
            isLoading={isLoading}
            handlePfpChange={handlePfpChange}
            key='bio'
            account={account} // account selected for viewing
            isSelf={isSelf}
            utils={utils}
          />
          <Tabs tab={tab} setTab={setTab} isSelf={isSelf} />
          <Bottom
            key='bottom'
            tab={tab}
            subTab={subTab}
            isSelf={isSelf}
            setSubTab={setSubTab}
            data={{ account, getAllAccs: () => getAllBaseAccounts(world, components) }}
            actions={{ acceptFren, blockFren, cancelFren, requestFren }}
            utils={utils}
          />
        </ModalWrapper>
      );
    }
  );
}
