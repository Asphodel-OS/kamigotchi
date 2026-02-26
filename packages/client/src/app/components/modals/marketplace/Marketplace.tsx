import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { erc20Abi, formatUnits } from 'viem';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getAccountKamis as _getAccountKamis } from 'app/cache/account';
import { getConfigAddress } from 'app/cache/config';
import { getKami as _getKami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { MarketplaceIcon } from 'assets/images/icons/menu';
import { Tokens } from 'constants/tokens';
import { EntityID, EntityIndex } from 'engine/recs';
import { BigNumberish } from 'ethers';
import { erc721ABI } from 'network/chain/ERC721';
import {
  getAccountByID as _getAccountByID,
  queryAccountFromEmbedded,
} from 'network/shapes/Account';
import {
  getAllKamis as _getAllKamis,
  queryKamiByIndex as _queryKamiByIndex,
} from 'network/shapes/Kami';
import { getRegistryTraits as _getRegistryTraits, TraitType } from 'network/shapes/Trait';
import { didActionSucceed, waitForActionCompletion } from 'network/utils';
import { DEFAULT_AFFINITY_FILTERS, DEFAULT_SELECTED_FILTERS, DEFAULT_STAT_FILTERS } from './constants';
import { CreateOrder } from './create/CreateOrder';
import { Bids } from './tabs/bids/Bids';
import { FilterBy } from './tabs/listings/FilterBy';
import { Listings } from './tabs/listings/Listings';
import { MyOrders } from './tabs/orders/MyOrders';
import { Tabs } from './tabs/Tabs';
import { MarketplaceTab } from './types';

export const MarketplaceModal: UIComponent = {
  id: 'MarketplaceModal',
  Render: () => {
    /////////////////
    // PREPARATION

    const { network } = useLayers();
    const { world, components, actions, api } = network;
    const accountEntity = queryAccountFromEmbedded(network);

    const kamiNFTAddress = getConfigAddress(world, components, 'KAMI721_ADDRESS');
    const marketVaultAddress = getConfigAddress(world, components, 'KAMI_MARKET_VAULT');

    const utils = useMemo(
      () => ({
        getAccountKamis: () => _getAccountKamis(world, components, accountEntity, { live: 0 }),
        getAllKamis: () => _getAllKamis(world, components),
        getRegistryTraits: (specificType?: TraitType[]) =>
          _getRegistryTraits(world, components, specificType),
        getKami: (entity: EntityIndex) => _getKami(world, components, entity, { live: 0 }),
        getKamiDetailed: (entity: EntityIndex) =>
          _getKami(world, components, entity, { live: 0, traits: 0, stats: 0, progress: 0 }),
        queryKamiByIndex: (index: number) => _queryKamiByIndex(world, components, index),
        getAccountByID: (id: string) => _getAccountByID(world, components, id as EntityID),
      }),
      [world, components, accountEntity]
    );
    const account = useAccount((s) => s.account);
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);

    /////////////////

    const { refetch: refetchApproval, data: approvalData } = useReadContracts({
      contracts: [
        {
          address: kamiNFTAddress,
          abi: erc721ABI,
          functionName: 'isApprovedForAll',
          args: [account.ownerAddress, marketVaultAddress],
        },
        {
          address: Tokens.ETH.address,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [account.ownerAddress, marketVaultAddress],
        },
      ],
    });

    useWatchBlockNumber({ onBlockNumber: () => refetchApproval() });

    const isVaultApproved = approvalData?.[0]?.result === true;
    const wethAllowance = (approvalData?.[1]?.result as bigint) ?? 0n;
    const isWethApproved = wethAllowance > 0n;

    const restingKamis = useMemo(
      () => utils.getAccountKamis().filter((kami) => kami.state === 'RESTING'),
      [utils, account.id, account.ownerAddress]
    );

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

    useWatchBlockNumber({ onBlockNumber: () => refetchNFTs() });

    const wildKamis = useMemo(() => {
      const result = (nftData?.[0]?.result ?? []) as number[];
      const entities = result.map((index: number) => utils.queryKamiByIndex(index));
      const filtered = entities.filter((entity) => !!entity) as EntityIndex[];
      return filtered.map((entity: EntityIndex) => utils.getKami(entity));
    }, [nftData, utils]);

    const isMarketplaceOpen = useVisibility((s) => s.modals.marketplace);

    const [tab, setTab] = useState<MarketplaceTab>('listings');
    const [showCreateOrder, setShowCreateOrder] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [selectedFilters, setSelectedFilters] =
      useState<Record<string, Set<string>>>(DEFAULT_SELECTED_FILTERS);
    const [statFilters, setStatFilters] = useState<Record<string, number>>(DEFAULT_STAT_FILTERS);
    const [affinityFilters, setAffinityFilters] = useState<{ body: string | null; hand: string | null }>(DEFAULT_AFFINITY_FILTERS);

    useEffect(() => {
      if (!isMarketplaceOpen) return;
      setShowCreateOrder(false);
      setShowFilter(false);
      setSelectedFilters(DEFAULT_SELECTED_FILTERS());
      setStatFilters(DEFAULT_STAT_FILTERS());
      setAffinityFilters(DEFAULT_AFFINITY_FILTERS());
    }, [isMarketplaceOpen]);

    /////////////////
    // PREPARATION

    const openCreateOrder = () => {
      if (showCreateOrder) {
        setShowCreateOrder(false);
        return;
      }
      setShowFilter(false);
      setShowCreateOrder(true);
    };

    const closeCreateOrder = () => setShowCreateOrder(false);

    const openFilter = () => {
      if (showFilter) {
        setShowFilter(false);
        return;
      }
      setShowCreateOrder(false);
      setShowFilter(true);
    };

    const closeFilter = () => setShowFilter(false);

    const normalizeAccountId = useCallback((accountId: string) => {
      try {
        return BigInt(accountId).toString();
      } catch {
        return accountId;
      }
    }, []);

    const isDifferentAccountId = useCallback((lhs: string, rhs: string) => {
      try {
        return BigInt(lhs).toString() !== BigInt(rhs).toString();
      } catch {
        return lhs !== rhs;
      }
    }, []);

    const formatEthPrice = useCallback((weiString: string, decimals: number) => {
      if (!weiString || weiString === '0') return '0';
      const num = Number(formatUnits(BigInt(weiString), 18));
      if (num > 0 && num < 0.00001) return '<0.00001';
      return num.toFixed(decimals).replace(/\.?0+$/, '');
    }, []);

    /////////////////
    // ACTIONS

    const ensureVaultApproval = async () => {
      if (isVaultApproved) return;
      if (!marketVaultAddress) throw new Error('KAMI_MARKET_VAULT is not configured');

      const ownerApi = apis.get(selectedAddress);
      if (!ownerApi) throw new Error(`API not established for ${selectedAddress}`);

      const actionID = uuid() as EntityID;
      const tx = actions.add({
        id: actionID,
        action: 'KamiMarketVaultApproval',
        params: [kamiNFTAddress, marketVaultAddress, true],
        description: `Approving marketplace vault to transfer your Kami`,
        execute: async () =>
          ownerApi.erc721.setApprovalForAll(
            kamiNFTAddress,
            marketVaultAddress,
            true
          ),
      });

      const succeeded = await didActionSucceed(actions.Action, tx);
      if (!succeeded) throw new Error('Vault approval failed');
      await refetchApproval();
    };

    const ensureWethApproval = async () => {
      if (isWethApproved) return;
      if (!marketVaultAddress) throw new Error('KAMI_MARKET_VAULT is not configured');

      const ownerApi = apis.get(selectedAddress);
      if (!ownerApi) throw new Error(`API not established for ${selectedAddress}`);

      const actionID = uuid() as EntityID;
      const tx = actions.add({
        id: actionID,
        action: 'KamiMarketWethApproval',
        params: [Tokens.ETH.address, marketVaultAddress],
        description: `Approving marketplace vault to use your ETH for bids`,
        execute: async () =>
          ownerApi.erc20.approve(
            Tokens.ETH.address,
            marketVaultAddress,
            2n ** 256n - 1n
          ),
      });

      const succeeded = await didActionSucceed(actions.Action, tx);
      if (!succeeded) throw new Error('WETH approval failed');
      await refetchApproval();
    };

    const createSellOrder = async (
      kamiIndex: number,
      price: BigNumberish,
      expiry: BigNumberish
    ) => {
      await ensureVaultApproval();
      const tx = actions.add({
        action: 'KamiMarketList',
        params: [kamiIndex, price, expiry],
        description: `Creating sell order for Kami ${kamiIndex}`,
        execute: async () => api.player.account.kamiMarket.list(kamiIndex, price, expiry),
      });
      return didActionSucceed(actions.Action, tx);
    };

    const createBuyOrder = async (price: BigNumberish, quantity: number, expiry: BigNumberish) => {
      await ensureWethApproval();
      const tx = actions.add({
        action: 'KamiMarketOffer',
        params: [price, quantity, expiry],
        description: `Creating buy order for ${quantity} Kami`,
        execute: async () => api.player.account.kamiMarket.offerCollection(price, quantity, expiry),
      });
      return didActionSucceed(actions.Action, tx);
    };

    const createBuyKamiOrder = async (
      kamiIndex: number,
      price: BigNumberish,
      expiry: BigNumberish
    ) => {
      await ensureWethApproval();
      const tx = actions.add({
        action: 'KamiMarketOffer',
        params: [kamiIndex, price, expiry],
        description: `Creating buy offer for Kami ${kamiIndex}`,
        execute: async () => api.player.account.kamiMarket.offer(kamiIndex, price, expiry),
      });
      return didActionSucceed(actions.Action, tx);
    };

    const buyListings = async (listingIDs: BigNumberish[], kamiIndices: number[], totalPrice: bigint) => {
      const ownerApi = apis.get(selectedAddress);
      if (!ownerApi) { console.error(`API not established for ${selectedAddress}`); return false; }
      const tx = actions.add({
        action: 'KamiMarketBuy',
        params: [listingIDs, totalPrice],
        description: `Buying Kami ${kamiIndices.join(', ')}`,
        execute: async () => ownerApi.account.kamiMarket.buy(listingIDs, totalPrice),
      });
      return didActionSucceed(actions.Action, tx);
    };

    const cancelOrder = (orderID: BigNumberish) => {
      actions.add({
        action: 'KamiMarketCancel',
        params: [orderID],
        description: `Canceling marketplace order`,
        execute: async () => api.player.account.kamiMarket.cancel(orderID),
      });
    };

    const acceptOfferBatch = async (offerID: BigNumberish, kamiIndices: number[]) => {
      await ensureVaultApproval();
      const tx = actions.add({
        action: 'KamiMarketAcceptOffer',
        params: [offerID, kamiIndices],
        description: kamiIndices.length === 1
          ? `Accepting offer for ${(() => { const e = utils.queryKamiByIndex(kamiIndices[0]); return e !== undefined ? utils.getKami(e).name : `Kami #${kamiIndices[0]}`; })()}`
          : `Accepting offer for ${kamiIndices.length} Kamis`,
        execute: async () => api.player.account.kamiMarket.acceptOfferBatch(offerID, kamiIndices),
      });
      return didActionSucceed(actions.Action, tx);
    };

    const acceptOffer = async (offerID: BigNumberish, kamiIndex: number) => {
      await ensureVaultApproval();
      const tx = actions.add({
        action: 'KamiMarketAcceptOffer',
        params: [offerID, kamiIndex],
        description: `Accepting offer for Kami ${kamiIndex}`,
        execute: async () => api.player.account.kamiMarket.acceptOffer(offerID, kamiIndex),
      });
      return didActionSucceed(actions.Action, tx);
    };

    /////////////////
    // MEMOIZED PROP OBJECTS

    const listingsUtils = useMemo(
      () => ({
        queryKamiByIndex: utils.queryKamiByIndex,
        getKami: utils.getKami,
        getKamiDetailed: utils.getKamiDetailed,
        getAccountByID: utils.getAccountByID,
        isDifferentAccountId,
        formatEthPrice,
      }),
      [utils, isDifferentAccountId, formatEthPrice]
    );

    const bidsUtils = useMemo(
      () => ({
        ...utils,
        getRestingKamis: () => restingKamis,
        getWildKamis: () => wildKamis,
        isDifferentAccountId,
        formatEthPrice,
      }),
      [utils, restingKamis, wildKamis, isDifferentAccountId, formatEthPrice]
    );

    const myOrdersUtils = useMemo(
      () => ({
        queryKamiByIndex: utils.queryKamiByIndex,
        getKami: utils.getKami,
        normalizeAccountId,
        formatEthPrice,
      }),
      [utils, normalizeAccountId, formatEthPrice]
    );

    const createOrderUtils = useMemo(
      () => ({
        ...utils,
        getRestingKamis: () => restingKamis,
        getWildKamis: () => wildKamis,
      }),
      [utils, restingKamis, wildKamis]
    );

    const filters = useMemo(
      () => ({ selected: selectedFilters, stats: statFilters, affinity: affinityFilters }),
      [selectedFilters, statFilters, affinityFilters]
    );

    const handleClearFilters = useCallback(() => {
      setSelectedFilters(DEFAULT_SELECTED_FILTERS());
      setStatFilters(DEFAULT_STAT_FILTERS());
      setAffinityFilters(DEFAULT_AFFINITY_FILTERS());
    }, []);

    /////////////////
    // DISPLAY

    return (
      <ModalWrapper
        id='marketplace'
        header={<ModalHeader title='KamiSwap' icon={MarketplaceIcon} />}
        canExit
        noPadding
        overlay
      >
        <Tabs
          tab={tab}
          setTab={setTab}
          onCreateOrder={openCreateOrder}
          onCloseCreateOrder={closeCreateOrder}
          createOrderOpen={showCreateOrder}
        />
        <Content>
          <Listings
            isVisible={tab === 'listings'}
            onOpenFilter={openFilter}
            onBuyListings={buyListings}
            onCancelListing={cancelOrder}
            onCloseFilter={closeFilter}
            onCloseCreateOrder={closeCreateOrder}
            createOrderOpen={showCreateOrder}
            accountId={account.id}
            filters={filters}
            utils={listingsUtils}
          />
          <Bids
            isVisible={tab === 'bids'}
            showCreateOrder={showCreateOrder}
            setShowFilter={setShowFilter}
            onCloseCreateOrder={closeCreateOrder}
            onAcceptOffer={acceptOffer}
            onAcceptOfferBatch={acceptOfferBatch}
            accountId={account.id}
            utils={bidsUtils}
          />
          <MyOrders
            isVisible={tab === 'myOrders'}
            onCancelOrder={cancelOrder}
            utils={myOrdersUtils}
          />
          <CreateOrder
            isVisible={showCreateOrder}
            onClose={closeCreateOrder}
            utils={createOrderUtils}
            createSellOrder={createSellOrder}
            createBuyOrder={createBuyOrder}
            createBuyKamiOrder={createBuyKamiOrder}
          />
          <FilterBy
            isVisible={showFilter}
            onClose={closeFilter}
            selected={selectedFilters}
            statValues={statFilters}
            affinityValues={affinityFilters}
            onSelectedChange={setSelectedFilters}
            onStatValuesChange={setStatFilters}
            onAffinityChange={setAffinityFilters}
            onClear={handleClearFilters}
            utils={utils}
          />
        </Content>
      </ModalWrapper>
    );
  },
};

const Content = styled.div`
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  overflow-x: hidden;
  overflow-y: hidden;
  padding: 0 0.6vw;
`;
