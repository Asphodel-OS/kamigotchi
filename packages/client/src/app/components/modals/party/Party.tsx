import { EntityID } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { getNodeByIndex } from 'app/cache/node';
import { HarvestButton, ModalHeader, ModalWrapper, UseItemButton } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork, useSelected, useTokens, useVisibility } from 'app/stores';
import { BalPair } from 'app/stores/tokens';
import { KamiIcon } from 'assets/images/icons/menu';
import { ONYX_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { getItemByIndex, Item, NullItem } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { Node, NullNode, passesNodeReqs } from 'network/shapes/Node';
import { getCompAddr } from 'network/shapes/utils';
import { KamiList } from './KamiList';
import { Toolbar } from './Toolbar';
import { Sort, View } from './types';

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
          const { nodeIndex } = useSelected.getState();

          const accountEntity = queryAccountFromEmbedded(network);
          const accRefreshOptions = {
            live: 0,
            inventory: 2,
          };
          const kamiRefreshOptions = {
            live: 0,
            bonuses: 5, // set this to 3600 once we get explicit triggers for updates
            harvest: 5, // set this to 60 once we get explicit triggers for updates
            skills: 5, // set this to 3600 once we get explicit triggers for updates
            flags: 10, // set this to 3600 once we get explicit triggers for updates
            config: 3600,
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
              getItem: (index: number) => getItemByIndex(world, components, index),
              getNode: (index: number) => getNodeByIndex(world, components, index),
              passesNodeReqs: (kami: Kami) => passesNodeReqs(world, components, nodeIndex, kami),
            },
          };
        })
      ),

    // Render
    ({ network, display, data, utils }) => {
      const { actions, api } = network;
      const { accountEntity, spender } = data;
      const { getAccount, getItem, getKamis, getNode, passesNodeReqs } = utils;

      const { modals } = useVisibility();
      const { selectedAddress, apis: ownerAPIs } = useNetwork();
      const { balances: tokenBals } = useTokens();

      const [account, setAccount] = useState<Account>(NullAccount);
      const [kamis, setKamis] = useState<Kami[]>([]);
      const [node, setNode] = useState<Node>(NullNode); // node of the current room
      const [sort, setSort] = useState<Sort>('state');
      const [tick, setTick] = useState(Date.now());
      const [view, setView] = useState<View>('expanded');

      const [displayedKamis, setDisplayedKamis] = useState<Kami[]>(kamis);
      const [onyxItem, setOnyxItem] = useState<Item>(NullItem);
      const [onyxInfo, setOnyxInfo] = useState<BalPair>({ allowance: 0, balance: 0 });

      // mounting
      useEffect(() => {
        // populate initial data
        const account = getAccount();
        setAccount(account);
        setKamis(getKamis());
        setOnyxItem(getItem(ONYX_INDEX));

        // set ticking
        const refreshClock = () => setTick(Date.now());
        const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
        return () => clearInterval(timerId);
      }, []);

      // update onyx info every tick or if the connnected account changes
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
        const roomIndex = account.roomIndex;
        setNode(getNode(roomIndex));
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

      // starts a harvest for the given pet and node
      const start = (kamis: Kami[], node: Node) => {
        const kamiIDs = kamis.map((kami) => kami.id);
        actions.add({
          action: 'HarvestStart',
          params: [kamiIDs, node.index],
          description:
            kamiIDs.length > 1
              ? `Placing ${kamis.length} kamis on ${node.name}`
              : `Placing ${kamis[0].name} on ${node.name}`,
          execute: async () => {
            return api.player.pet.harvest.start(kamiIDs, node.index);
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
          <Toolbar
            actions={{
              addKamis: (kamis: Kami[]) => start(kamis, node),
            }}
            controls={{ sort, setSort, view, setView }}
            data={{ kamis }}
            state={{ displayedKamis, setDisplayedKamis, tick }}
            utils={utils}
          />
          <KamiList
            actions={{
              onyxApprove: approveOnyxTx,
              onyxRevive: onyxReviveTx,
              addKamis: (kamis: Kami[]) => start(kamis, node),
            }}
            controls={{ view }}
            data={{
              account,
              kamis,
              node,
              onyx: onyxInfo,
            }}
            display={display}
            state={{ displayedKamis, tick }}
          />
        </ModalWrapper>
      );
    }
  );
}
