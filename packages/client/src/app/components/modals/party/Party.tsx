import { useEffect, useState } from 'react';
import { erc721Abi } from 'viem';
import { useReadContracts, useWatchBlockNumber, useWriteContract } from 'wagmi';

import {
  AccountOptions,
  getAccount as _getAccount,
  getAllAccounts as _getAllAccounts,
  getAccountKamis,
} from 'app/cache/account';
import { getTempBonuses as _getTempBonuses } from 'app/cache/bonus';
import { getConfigAddress } from 'app/cache/config';
import { getKami as _getKami } from 'app/cache/kami';
import { getNodeByIndex } from 'app/cache/node';
import {
  ModalHeader,
  ModalWrapper,
  HarvestButton as _HarvestButton,
  UseItemButton as _UseItemButton,
} from 'app/components/library';
import { UIComponent, useLayers } from 'app/root';
import { useAccount, useNetwork, useSelected, useVisibility } from 'app/stores';
import { KamiIcon } from 'assets/images/icons/menu';
import { EntityIndex } from 'engine/recs';
import { erc721ABI } from 'network/chain/ERC721';
import {
  Account,
  NullAccount,
  queryAllAccounts as _queryAllAccounts,
  queryAccountFromEmbedded,
} from 'network/shapes/Account';
import { getItemByIndex } from 'network/shapes/Item';
import {
  Kami,
  queryKamiByIndex as _queryKamiByIndex,
  calcKamiExpRequirement,
} from 'network/shapes/Kami';
import { Node, NullNode, passesNodeReqs as _passesNodeReqs } from 'network/shapes/Node';
import { KamiList } from './KamiList';
import { SendBar } from './SendBar';
import { Toolbar } from './Toolbar';
import { Sort, View } from './types';

const REFRESH_INTERVAL = 1000;

export const PartyModal: UIComponent = {
  id: 'PartyModal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network, data, display, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const { debug } = useAccount.getState();
      const accountEntity = queryAccountFromEmbedded(network);
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
        },

        display: {
          HarvestButton: (account: Account, kami: Kami, node: Node) =>
            _HarvestButton({ network, account, kami, node }),
          UseItemButton: (kami: Kami, account: Account, icon: string) =>
            _UseItemButton(network, kami, account, icon),
        },
        utils: {
          calcExpRequirement: (lvl: number) => calcKamiExpRequirement(world, components, lvl),
          getAccount: (entity: EntityIndex, options?: AccountOptions) =>
            _getAccount(world, components, entity, options),
          getAllAccounts: () => _getAllAccounts(world, components),
          getTempBonuses: (kami: Kami) =>
            _getTempBonuses(world, components, kami.entity, kamiRefreshOptions.bonuses),
          getItem: (index: number) => getItemByIndex(world, components, index),
          getKami: (entity: EntityIndex) => _getKami(world, components, entity, kamiRefreshOptions),
          getNode: (index: number) => getNodeByIndex(world, components, index),
          getWorldKamis: () =>
            getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
          passesNodeReqs: (node: Node, kami: Kami) =>
            _passesNodeReqs(world, components, node.index, kami), // TODO: use a cache function for this
          queryKamiByIndex: (index: number) => _queryKamiByIndex(world, components, index),
          queryAllAccounts: () => _queryAllAccounts(components),
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { actions, api } = network;
    const { accountEntity, kamiNFTAddress } = data;
    const { getNode, getAccount, queryAllAccounts } = utils;
    const { getKami, getWorldKamis, queryKamiByIndex, passesNodeReqs } = utils;

    const { writeContract } = useWriteContract();
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const ownerAPIs = useNetwork((s) => s.apis);
    const nodeIndex = useSelected((s) => s.nodeIndex);
    const isModalOpen = useVisibility((s) => s.modals.party);

    const [account, setAccount] = useState<Account>(NullAccount);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [kamis, setKamis] = useState<Kami[]>([]);
    const [node, setNode] = useState<Node>(NullNode); // node of the current room
    const [sort, setSort] = useState<Sort>('state');
    const [tick, setTick] = useState(Date.now());
    const [view, setView] = useState<View>('expanded');

    const [displayedKamis, setDisplayedKamis] = useState<Kami[]>(kamis);
    const [wildKamis, setWildKamis] = useState<Kami[]>([]);

    /////////////////
    // SUBSCRIPTIONS

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

    // mounting
    useEffect(() => {
      // populate initial data
      setAccount(getAccount(accountEntity, { live: 0, inventory: 2 }));
      setKamis(getWorldKamis());

      // set ticking
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
      return () => clearInterval(timerId);
    }, []);

    // update account and kamis every tick or if the connnected account changes
    useEffect(() => {
      if (!isModalOpen) return;

      // update the connected account if it changes
      if (accountEntity != account.entity) {
        const account = getAccount(accountEntity, { live: 0, inventory: 2 });
        setAccount(account);
      }

      // update the list of kamis in the world
      const worldKamis = getWorldKamis();
      setKamis(worldKamis);

      // check if we need to update the list of accounts
      const accountEntities = queryAllAccounts() as EntityIndex[];
      if (accountEntities.length - 1 > accounts.length) {
        const filtered = accountEntities.filter((entity) => entity != accountEntity);
        const newAccounts = filtered.map((entity) => getAccount(entity));
        const accountsSorted = newAccounts.sort((a, b) => a.name.localeCompare(b.name));
        setAccounts(accountsSorted);
      }
    }, [isModalOpen, accountEntity, tick]);

    // update node if the account or room changes
    useEffect(() => {
      const roomIndex = account.roomIndex;
      const node = getNode(roomIndex);
      setNode(node);
    }, [accountEntity, account.roomIndex]);

    // update the node if the selected node changes
    useEffect(() => {
      const node = getNode(nodeIndex);
      setNode(node);
    }, [nodeIndex]);

    // update list of wild kamis whenever that changes
    // TOTO: properly typecast the result of the abi call
    useEffect(() => {
      const result = (nftData?.[0]?.result ?? []) as number[];
      if (result.length != wildKamis.length) {
        const entities = result.map((index: number) => queryKamiByIndex(index));
        const filtered = entities.filter((entity) => !!entity) as EntityIndex[];
        const externalKamis = filtered.map((entity: EntityIndex) => getKami(entity));
        setWildKamis(externalKamis);
      }
    }, [nftData]);

    /////////////////
    // ACTIONS

    // send a kami NFT to another player
    const sendKamiTx = (kami: Kami, to: Account) => {
      writeContract({
        abi: erc721Abi,
        address: kamiNFTAddress,
        functionName: 'safeTransferFrom',
        args: [account.ownerAddress, to.ownerAddress, BigInt(kami.index)],
      });
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
          return api.portal.ERC721.kami.batch.stake(indices);
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
            collectKami: (kamis: Kami[]) => collect(kamis),
            stopKami: (kamis: Kami[]) => stop(kamis),
            stakeKami: (kamis: Kami[]) => stakeKamiTx(kamis),
          }}
          controls={{ sort, setSort, view, setView }}
          data={{ account, kamis, wildKamis }}
          state={{ displayedKamis, setDisplayedKamis, tick }}
          utils={{ passesNodeReqs: (kami: Kami) => passesNodeReqs(node, kami) }}
        />
        <KamiList
          actions={{
            addKamis: (kamis: Kami[]) => start(kamis, node),
            stakeKamis: stakeKamiTx,
            sendKamis: sendKamiTx,
          }}
          controls={{ view }}
          data={{ account, accounts, kamis, wildKamis, node }}
          display={display}
          state={{ displayedKamis, tick }}
          utils={utils}
        />
        <SendBar
          actions={{ sendKami: (k: Kami, a: Account) => sendKamiTx(k, a) }}
          controls={{ sort, view }}
          data={{ accounts }}
          state={{ kamis: displayedKamis }}
          isVisible={isModalOpen && view === 'external'}
        />
      </ModalWrapper>
    );
  },
};
