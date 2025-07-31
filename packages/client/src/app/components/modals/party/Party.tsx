import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getAccount, getAccountKamis, getAllAccounts } from 'app/cache/account';
import { getTempBonuses } from 'app/cache/bonus';
import { getConfigAddress } from 'app/cache/config';
import { getKami } from 'app/cache/kami';
import { getNodeByIndex } from 'app/cache/node';
import { HarvestButton, ModalHeader, ModalWrapper, UseItemButton } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork, useSelected, useTokens, useVisibility } from 'app/stores';
import { BalPair } from 'app/stores/tokens';
import { KamiIcon } from 'assets/images/icons/menu';
import { ONYX_INDEX } from 'constants/items';
import { erc721ABI } from 'network/chain/ERC721';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { getItemByIndex, Item, NullItem } from 'network/shapes/Item';
import { calcKamiExpRequirement, Kami, queryKamiByIndex } from 'network/shapes/Kami';
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
            progress: 5,
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
              kamiNFTAddress: getConfigAddress(world, components, 'KAMI721_ADDRESS'),
              spender: getCompAddr(world, components, 'component.token.allowance'),
            },

            display: {
              HarvestButton: (account: Account, kami: Kami, node: Node) =>
                HarvestButton({ network, account, kami, node }),
              UseItemButton: (kami: Kami, account: Account, icon: string) =>
                UseItemButton(network, kami, account, icon),
            },
            utils: {
              calcExpRequirement: (lvl: number) => calcKamiExpRequirement(world, components, lvl),
              getAccount: () => getAccount(world, components, accountEntity, accRefreshOptions),
              getAllAccounts: () => getAllAccounts(world, components),
              getTempBonuses: (kami: Kami) =>
                getTempBonuses(world, components, kami.entity, kamiRefreshOptions.bonuses),
              getItem: (index: number) => getItemByIndex(world, components, index),
              getKami: (entity: EntityIndex) =>
                getKami(world, components, entity, kamiRefreshOptions),
              getNode: (index: number) => getNodeByIndex(world, components, index),
              getWorldKamis: () =>
                getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
              passesNodeReqs: (kami: Kami) => passesNodeReqs(world, components, nodeIndex, kami),
              queryKamiByIndex: (index: number) => queryKamiByIndex(world, components, index),
            },
          };
        })
      ),

    // Render
    ({ network, display, data, utils }) => {
      const { actions, api } = network;
      const { accountEntity, kamiNFTAddress, spender } = data;
      const { getAccount, getItem, getNode } = utils;
      const { getKami, getWorldKamis, queryKamiByIndex } = utils;

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
      const [wildKamis, setWildKamis] = useState<Kami[]>([]);
      const [onyxItem, setOnyxItem] = useState<Item>(NullItem);
      const [onyxInfo, setOnyxInfo] = useState<BalPair>({ allowance: 0, balance: 0 });

      /////////////////
      // BLOCK WATCHERS

      useWatchBlockNumber({
        onBlockNumber: () => refetchNFTs(),
      });

      const { refetch: refetchNFTs, data: nftData } = useReadContracts({
        contracts: [
          {
            address: kamiNFTAddress,
            abi: erc721ABI,
            functionName: 'getAllTokens',
            args: [account.ownerAddress],
          },
        ],
      });

      /////////////////
      // SUBSCRIPTIONS

      // mounting
      useEffect(() => {
        // populate initial data
        const account = getAccount();
        setAccount(account);
        setKamis(getWorldKamis());
        setOnyxItem(getItem(ONYX_INDEX));

        // set ticking
        const refreshClock = () => setTick(Date.now());
        const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
        return () => clearInterval(timerId);
      }, []);

      // update account and kamis every tick or if the connnected account changes
      useEffect(() => {
        if (!modals.party) return;
        const account = getAccount();
        setAccount(account);
        setKamis(getWorldKamis());
      }, [modals.party, accountEntity, tick]);

      // update node if the account or room changes
      useEffect(() => {
        const roomIndex = account.roomIndex;
        setNode(getNode(roomIndex));
      }, [accountEntity, account.roomIndex]);

      // update onyx info every tick or if the connnected account changes
      useEffect(() => {
        if (!onyxItem.address) return;
        const onyxInfo = tokenBals.get(onyxItem.address);
        setOnyxInfo(onyxInfo ?? { allowance: 0, balance: 0 });
      }, [onyxItem, spender, tick]);

      // update list of wild kamis whenever that changes
      // TOTO: properly typecast the result of the abi call
      useEffect(() => {
        const result = (nftData?.[0]?.result ?? []) as number[];
        const entities = result.map((index: number) => queryKamiByIndex(index));
        const filtered = entities.filter((entity) => !!entity) as EntityIndex[];
        const externalKamis = filtered.map((entity: EntityIndex) => getKami(entity));
        setWildKamis(externalKamis);
      }, [nftData]);

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

      // send a kami NFT to another player
      const sendKamiTx = (kami: Kami, account: Account) => {
        return;
      };

      // import a kami from the wild to the world
      const stakeKamiTx = (kamis: Kami[]) => {
        const api = ownerAPIs.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const indices = kamis.map((kami) => kami.index);
        actions.add({
          action: 'KamiDeposit',
          params: [kamis[0].index],
          description: `Staking Kami ${kamis[0].index}`,
          execute: async () => {
            return api.bridge.ERC721.kami.batch.stake(indices);
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
              ? `Placing ${kamis.length} kami on ${node.name}`
              : `Placing ${kamis[0].name} on ${node.name}`,
          execute: async () => {
            return api.player.pet.harvest.start(kamiIDs, node.index);
          },
        });
      };

      // collects on an existing harvest
      const collect = (kamis: Kami[]) => {
        const kamiHarvestIDs = kamis.map((kami) => kami.harvest!.id);
        actions.add({
          action: 'HarvestCollect',
          params: [kamiHarvestIDs],
          description:
            kamiHarvestIDs.length > 1
              ? `Collecting ${kamis.length} kami Harvest`
              : `Collecting ${kamis[0].name}'s Harvest`,
          execute: async () => {
            return api.player.pet.harvest.collect(kamiHarvestIDs);
          },
        });
      };

      // stops a harvest
      const stop = (kamis: Kami[]) => {
        const kamiHarvestIDs = kamis.map((kami) => kami.harvest!.id);
        actions.add({
          action: 'HarvestStop',
          params: [kamiHarvestIDs],
          description:
            kamiHarvestIDs.length > 1
              ? `Removing ${kamis.length} kami from nodes`
              : `Removing ${kamis[0].name} from ${kamis[0].harvest?.node}`,
          execute: async () => {
            return api.player.pet.harvest.stop(kamiHarvestIDs);
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
              addKami: (kamis: Kami[]) => start(kamis, node),
              stopKami: (kamis: Kami[]) => stop(kamis),
              collect: (kamis: Kami[]) => collect(kamis),
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
              stakeKamis: stakeKamiTx,
              sendKamis: sendKamiTx,
            }}
            controls={{ view }}
            data={{
              account,
              kamis,
              wildKamis,
              node,
              onyx: onyxInfo,
            }}
            display={display}
            state={{ displayedKamis, tick }}
            utils={utils}
          />
        </ModalWrapper>
      );
    }
  );
}
