import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatUnits } from 'viem';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getAccountKamis as _getAccountKamis } from 'app/cache/account';
import { getConfigAddress } from 'app/cache/config';
import { getKami as _getKami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork } from 'app/stores';
import { TradeIcon } from 'assets/images/icons/menu';
import { EntityID, EntityIndex } from 'engine/recs';
import { BigNumberish } from 'ethers';
import { erc721ABI } from 'network/chain/ERC721';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import {
  getAllKamis as _getAllKamis,
  queryKamiByIndex as _queryKamiByIndex,
} from 'network/shapes/Kami';
import { getRegistryTraits as _getRegistryTraits, TraitType } from 'network/shapes/Trait';
import { didActionSucceed, waitForActionCompletion } from 'network/utils';
import { CreateOrder } from './create/CreateOrder';
import { Bids } from './tabs/bids/Bids';
import { FilterBy } from './tabs/listings/FilterBy';
import { Listings } from './tabs/listings/Listings';
import { MyOrders } from './tabs/orders/MyOrders';
import { MarketplaceTab, Tabs } from './tabs/Tabs';

const DEFAULT_SELECTED_FILTERS = () => ({
  Face: new Set<string>(),
  Hands: new Set<string>(),
  'Body Type': new Set<string>(),
  'Body Color': new Set<string>(),
  Background: new Set<string>(),
});

const DEFAULT_STAT_FILTERS = () => ({
  Health: 10,
  Power: 10,
  Violence: 10,
  Harmony: 10,
  Slots: 1,
});

export const MarketplaceModal: UIComponent = {
  id: 'MarketplaceModal',
  Render: () => {
    /////////////////
    // PREPARATION

    const {
      utils,
      data,
      network: { actions, world },
    } = (() => {
      const { network } = useLayers();
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);

      const kamiNFTAddress = getConfigAddress(world, components, 'KAMI721_ADDRESS');
      const marketVaultAddress = getConfigAddress(world, components, 'KAMI_MARKET_VAULT');

      return {
        utils: {
          getAccountKamis: () => _getAccountKamis(world, components, accountEntity, { live: 0 }),
          getAllKamis: () => _getAllKamis(world, components),
          getRegistryTraits: (specificType?: TraitType[]) =>
            _getRegistryTraits(world, components, specificType),
          getKami: (entity: EntityIndex) => _getKami(world, components, entity, { live: 0 }),
          getKamiDetailed: (entity: EntityIndex) =>
            _getKami(world, components, entity, { live: 0, traits: 0, stats: 0, progress: 0 }),
          queryKamiByIndex: (index: number) => _queryKamiByIndex(world, components, index),
        },
        network,
        data: { kamiNFTAddress, marketVaultAddress },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const account = useAccount((s) => s.account);

    /////////////////
    // SUBSCRIPTIONS

    const { refetch: refetchNFTs, data: nftData } = useReadContracts({
      contracts: [
        {
          address: data.kamiNFTAddress,
          abi: erc721ABI,
          functionName: 'getAllTokens',
          args: [account.ownerAddress],
        },
        {
          address: data.kamiNFTAddress,
          abi: erc721ABI,
          functionName: 'isApprovedForAll',
          args: [account.ownerAddress, data.marketVaultAddress],
        },
      ],
    });

    useWatchBlockNumber({
      onBlockNumber: () => refetchNFTs(),
    });

    const externalKamis = useMemo(() => {
      const result = (nftData?.[0]?.result ?? []) as number[];
      const entities = result
        .map((index: number) => utils.queryKamiByIndex(index))
        .filter((entity) => !!entity) as EntityIndex[];
      return entities.map((entity) => utils.getKami(entity));
    }, [nftData]);
    const isVaultApproved = nftData?.[1]?.result === true;

    const getApi = () => {
      const api = apis.get(selectedAddress);
      if (!api) console.error(`API not established for ${selectedAddress}`);
      return api;
    };

    const ensureVaultApproval = async (api: any) => {
      if (isVaultApproved) return;
      if (!data.marketVaultAddress) return console.error('KAMI_MARKET_VAULT is not configured');

      const actionID = uuid() as EntityID;
      actions.add({
        id: actionID,
        action: 'KamiMarketVaultApproval',
        params: [data.kamiNFTAddress, data.marketVaultAddress, true],
        description: `Approving marketplace vault to transfer your Kami`,
        execute: async () =>
          api.erc721.setApprovalForAll(data.kamiNFTAddress, data.marketVaultAddress, true),
      });

      await waitForActionCompletion(
        actions.Action,
        world.entityToIndex.get(actionID) as EntityIndex
      );
      await refetchNFTs();
    };

    /////////////////
    // ACTIONS

    const createSellOrder = async (
      kamiIndex: number,
      price: BigNumberish,
      expiry: BigNumberish
    ) => {
      const api = getApi();
      if (!api) return false;
      await ensureVaultApproval(api);

      const tx = actions.add({
        action: 'KamiMarketList',
        params: [kamiIndex, price, expiry],
        description: `Creating sell order for Kami ${kamiIndex}`,
        execute: async () => api.account.kamiMarket.list(kamiIndex, price, expiry),
      });
      return didActionSucceed(actions.Action, tx);
    };

    const createBuyOrder = async (price: BigNumberish, quantity: number, expiry: BigNumberish) => {
      const api = getApi();
      if (!api) return false;

      const tx = actions.add({
        action: 'KamiMarketOffer',
        params: [price, quantity, expiry],
        description: `Creating buy order for ${quantity} Kami`,
        execute: async () => api.account.kamiMarket.offerCollection(price, quantity, expiry),
      });
      return didActionSucceed(actions.Action, tx);
    };

    const createBuyKamiOrder = async (
      kamiIndex: number,
      price: BigNumberish,
      expiry: BigNumberish
    ) => {
      const api = getApi();
      if (!api) return false;

      const tx = actions.add({
        action: 'KamiMarketOffer',
        params: [kamiIndex, price, expiry],
        description: `Creating buy offer for Kami ${kamiIndex}`,
        execute: async () => api.account.kamiMarket.offer(kamiIndex, price, expiry),
      });
      return didActionSucceed(actions.Action, tx);
    };

    const buyListings = (listingIDs: BigNumberish[], kamiIndices: number[], totalPrice: bigint) => {
      const api = getApi();
      if (!api) return;

      actions.add({
        action: 'KamiMarketBuy',
        params: [listingIDs, totalPrice],
        description: `Buying Kami ${kamiIndices.join(', ')}`,
        execute: async () => api.account.kamiMarket.buy(listingIDs, totalPrice),
      });
    };

    const cancelOrder = (orderID: BigNumberish) => {
      const api = getApi();
      if (!api) return;

      actions.add({
        action: 'KamiMarketCancel',
        params: [orderID],
        description: `Canceling marketplace order`,
        execute: async () => api.account.kamiMarket.cancel(orderID),
      });
    };

    const acceptOffer = async (offerID: BigNumberish, kamiIndex: number) => {
      const api = getApi();
      if (!api) return;
      await ensureVaultApproval(api);

      actions.add({
        action: 'KamiMarketAcceptOffer',
        params: [offerID, kamiIndex],
        description: `Accepting offer for Kami #${kamiIndex}`,
        execute: async () => api.account.kamiMarket.acceptOffer(offerID, kamiIndex),
      });
    };

    const [tab, setTab] = useState<MarketplaceTab>('listings');
    const [showCreateOrder, setShowCreateOrder] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [selectedFilters, setSelectedFilters] =
      useState<Record<string, Set<string>>>(DEFAULT_SELECTED_FILTERS);
    const [statFilters, setStatFilters] = useState<Record<string, number>>(DEFAULT_STAT_FILTERS);

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

    const normalizeAccountId = (accountId: string) => {
      try {
        return BigInt(accountId).toString();
      } catch {
        return accountId;
      }
    };

    const isDifferentAccountId = (lhs: string, rhs: string) => {
      try {
        return BigInt(lhs).toString() !== BigInt(rhs).toString();
      } catch {
        return lhs !== rhs;
      }
    };

    const formatEthPrice = (weiString: string, decimals: number) => {
      if (!weiString || weiString === '0') return '0';
      const num = Number(formatUnits(BigInt(weiString), 18));
      if (num > 0 && num < 0.00001) return '<0.00001';
      return num.toFixed(decimals).replace(/\.?0+$/, '');
    };

    /////////////////
    // DISPLAY

    return (
      <ModalWrapper
        id='marketplace'
        header={<ModalHeader title='KamiSwap!' icon={TradeIcon} />}
        canExit
        noPadding
        overlay
      >
        <Tabs
          tab={tab}
          setTab={setTab}
          onCreateOrder={openCreateOrder}
          onCloseCreateOrder={closeCreateOrder}
        />
        <Content>
          <Listings
            isVisible={tab === 'listings'}
            onOpenFilter={openFilter}
            onBuyListings={buyListings}
            onCloseFilter={closeFilter}
            onCloseCreateOrder={closeCreateOrder}
            createOrderOpen={showCreateOrder}
            accountId={account.id}
            filters={{ selected: selectedFilters, stats: statFilters }}
            utils={{
              queryKamiByIndex: utils.queryKamiByIndex,
              getKami: utils.getKami,
              getKamiDetailed: utils.getKamiDetailed,
              isDifferentAccountId,
              formatEthPrice,
            }}
          />
          <Bids
            isVisible={tab === 'bids'}
            showCreateOrder={showCreateOrder}
            setShowFilter={setShowFilter}
            onCloseCreateOrder={closeCreateOrder}
            onAcceptOffer={acceptOffer}
            accountId={account.id}
            utils={{
              ...utils,
              getExternalKamis: () => externalKamis,
              isDifferentAccountId,
              formatEthPrice,
            }}
          />
          <MyOrders
            isVisible={tab === 'myOrders'}
            onCancelOrder={cancelOrder}
            onOpenHistory={closeCreateOrder}
            createOrderOpen={showCreateOrder}
            utils={{
              queryKamiByIndex: utils.queryKamiByIndex,
              getKami: utils.getKami,
              normalizeAccountId,
              formatEthPrice,
            }}
          />
          <CreateOrder
            isVisible={showCreateOrder}
            onClose={closeCreateOrder}
            utils={{ ...utils, getExternalKamis: () => externalKamis }}
            createSellOrder={createSellOrder}
            createBuyOrder={createBuyOrder}
            createBuyKamiOrder={createBuyKamiOrder}
          />
          <FilterBy
            isVisible={showFilter}
            onClose={closeFilter}
            selected={selectedFilters}
            statValues={statFilters}
            onSelectedChange={setSelectedFilters}
            onStatValuesChange={setStatFilters}
            onClear={() => {
              setSelectedFilters(DEFAULT_SELECTED_FILTERS());
              setStatFilters(DEFAULT_STAT_FILTERS());
            }}
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
