import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { EntityID } from '@mud-classic/recs';
import { getAccount, getAccountKamis } from 'app/cache/account';
import { getNodeByIndex } from 'app/cache/node';
import { HarvestButton, ModalHeader, ModalWrapper, UseItemButton } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork, useTokens, useVisibility } from 'app/stores';
import { BalPair } from 'app/stores/tokens';
import { KamiIcon } from 'assets/images/icons/menu';
import { ONYX_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { getItemByIndex, Item, NullItem } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { Node, NullNode } from 'network/shapes/Node';
import { getCompAddr } from 'network/shapes/utils';
import { KamiList } from './KamiList';

const REFRESH_INTERVAL = 1000;

export function registerPartyModal() {
  registerUIComponent(
    'PartyModal',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const { debug } = useAccount.getState();

          const accountEntity = queryAccountFromEmbedded(network);
          const accRefreshOptions = {
            live: 0,
            inventory: 2,
          };
          const kamiRefreshOptions = {
            live: 0,
            bonuses: 5, // set this to 3600 once we get explicit triggers for updates
            config: 3600,
            flags: 10, // set this to 3600 once we get explicit triggers for updates
            harvest: 5, // set this to 60 once we get explicit triggers for updates
            skills: 5, // set this to 3600 once we get explicit triggers for updates
            stats: 3600,
            traits: 3600,
          };

          return {
            network,
            data: {
              accountEntity,
              spender: getCompAddr(world, components, 'component.token.allowance'),
            },

            display: {
              HarvestButton: (account: Account, kami: Kami, node: Node) =>
                HarvestButton({ network, account, kami, node }),
              UseItemButton: (kami: Kami, account: Account, icon: string) =>
                UseItemButton(network, kami, account, icon),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity, accRefreshOptions),
              getKamis: () =>
                getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
              getNode: (index: number) => getNodeByIndex(world, components, index),
              getItem: (index: number) => getItemByIndex(world, components, index),
            },
          };
        })
      ),

    // Render
    ({ network, display, data, utils }) => {
      const { world, components, actions } = network;
      const { accountEntity, spender } = data;
      const { getAccount, getKamis, getNode } = utils;
      const { modals } = useVisibility();
      const { selectedAddress, apis: ownerAPIs } = useNetwork();
      const { balances: tokenBals } = useTokens();

      const [account, setAccount] = useState<Account>(NullAccount);
      const [kamis, setKamis] = useState<Kami[]>([]);
      const [node, setNode] = useState<Node>(NullNode); // node of the current room
      const [tick, setTick] = useState(Date.now());

      const [onyxItem, setOnyxItem] = useState<Item>(NullItem);
      const [onyxInfo, setOnyxInfo] = useState<BalPair>({ allowance: 0, balance: 0 });

      // mounting
      useEffect(() => {
        // populate initial data
        const account = getAccount();
        setAccount(account);
        setKamis(getKamis());
        setOnyxItem(getItemByIndex(world, components, ONYX_INDEX));

        // set ticking
        const refreshClock = () => setTick(Date.now());
        const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
        return () => clearInterval(timerId);
      }, []);

      useEffect(() => {
        const onyxInfo = tokenBals.get(onyxItem.address!);
        setOnyxInfo(onyxInfo ?? { allowance: 0, balance: 0 });
      }, [onyxItem, spender, tick]);

      // update account and kamis every tick or if the connnected account changes
      useEffect(() => {
        if (!modals.party) return;
        const account = getAccount();
        setAccount(account);
        setKamis(getKamis());
      }, [modals.party, accountEntity, tick]);

      // update node if the account or room changes
      useEffect(() => {
        const room = account.roomIndex;
        setNode(getNode(room));
      }, [accountEntity, account.roomIndex]);

      /////////////////
      // ACTIONS

      // approve the spend of an ERC20 token
      const approveOnyxTx = async (price: number) => {
        const api = ownerAPIs.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Approve token',
          params: [onyxItem.address, spender, price],
          description: `Approve ${price} ${onyxItem.name} to be spent`,
          execute: async () => {
            return api.erc20.approve(onyxItem.address!, spender, price);
          },
        });
      };

      const onyxReviveTx = async (kami: Kami) => {
        const api = ownerAPIs.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Onyx revive',
          params: [kami.id],
          description: `Reviving ${kami.name} with ONYX`,
          execute: async () => {
            return api.pet.onyx.revive(kami.id);
          },
        });
      };
      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='party'
          header={<ModalHeader title='Party' icon={KamiIcon} />}
          canExit
          truncate
          noPadding
        >
          <KamiList
            actions={{
              onyxApprove: approveOnyxTx,
              onyxRevive: onyxReviveTx,
            }}
            data={{
              account,
              kamis,
              node,
              onyx: onyxInfo,
            }}
            display={display}
            state={{ tick }}
          />
        </ModalWrapper>
      );
    }
  );
}
