import { useMemo, useState } from 'react';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getAccountKamis as _getAccountKamis } from 'app/cache/account';
import { getConfigAddress } from 'app/cache/config';
import { getKami as _getKami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork } from 'app/stores';
import VendIcon from 'assets/images/rooms/18_cave-crossroads/vend.png';
import { EntityIndex } from 'engine/recs';
import { BigNumberish } from 'ethers';
import { erc721ABI } from 'network/chain/ERC721';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import {
  getAllKamis as _getAllKamis,
  queryKamiByIndex as _queryKamiByIndex,
} from 'network/shapes/Kami';
import { getRegistryTraits as _getRegistryTraits, TraitType } from 'network/shapes/Trait';
import { Bids } from './Bids';
import { CreateOrder } from './CreateOrder';
import { FilterBy } from './FilterBy';
import { Listings } from './Listings';
import { MyOrders } from './MyOrders';
import { Tabs } from './tabs/Tabs';

export const MarketPlaceModal: UIComponent = {
  id: 'MarketPlaceModal',
  Render: () => {
    const {
      utils,
      data,
      network: { actions, api },
    } = (() => {
      const { network } = useLayers();
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);

      const kamiNFTAddress = getConfigAddress(world, components, 'KAMI721_ADDRESS');

      return {
        utils: {
          getAccountKamis: () => _getAccountKamis(world, components, accountEntity, { live: 0 }),
          getAllKamis: () => _getAllKamis(world, components),
          getRegistryTraits: (specificType?: TraitType[]) =>
            _getRegistryTraits(world, components, specificType),
          getKami: (entity: EntityIndex) => _getKami(world, components, entity, { live: 0 }),
          queryKamiByIndex: (index: number) => _queryKamiByIndex(world, components, index),
        },
        network,
        data: { kamiNFTAddress },
      };
    })();
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const account = useAccount((s) => s.account);

    const { refetch: refetchNFTs, data: nftData } = useReadContracts({
      contracts: [
        {
          address: data.kamiNFTAddress,
          abi: erc721ABI,
          functionName: 'getAllTokens',
          args: [account.ownerAddress],
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

    const createSellOrder = (kamiIndex: number, price: BigNumberish, expiry: BigNumberish) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      actions.add({
        action: 'KamiMarketList',
        params: [kamiIndex, price, expiry],
        description: `Creating sell order for Kami ${kamiIndex}`,
        execute: async () => api.account.kamiMarket.list(kamiIndex, price, expiry),
      });
    };

    const createBuyOrder = (price: BigNumberish, quantity: number, expiry: BigNumberish) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      actions.add({
        action: 'KamiMarketOffer',
        params: [price, quantity, expiry],
        description: `Creating buy order for ${quantity} Kami`,
        execute: async () => api.account.kamiMarket.offerCollection(price, quantity, expiry),
      });
    };

    const createBuyKamiOrder = (kamiIndex: number, price: BigNumberish, expiry: BigNumberish) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      actions.add({
        action: 'KamiMarketOffer',
        params: [kamiIndex, price, expiry],
        description: `Creating buy offer for Kami ${kamiIndex}`,
        execute: async () => api.account.kamiMarket.offer(kamiIndex, price, expiry),
      });
    };

    const [tab, setTab] = useState('listings');
    const [showCreateOrder, setShowCreateOrder] = useState(false);
    const [showFilter, setShowFilter] = useState(false);

    const openCreateOrder = () => {
      setShowFilter(false);
      setShowCreateOrder(true);
    };
    const closeCreateOrder = () => setShowCreateOrder(false);
    const openFilter = () => {
      setShowCreateOrder(false);
      setShowFilter(true);
    };
    const closeFilter = () => setShowFilter(false);

    return (
      <ModalWrapper
        id='marketplace'
        header={<ModalHeader title='Marketplace' icon={VendIcon} />}
        canExit
      >
        <Tabs tab={tab} setTab={setTab} onCreateOrder={openCreateOrder} />
        <Listings isVisible={tab === 'listings'} onOpenFilter={openFilter} />
        <Bids
          isVisible={tab === 'bids'}
          showCreateOrder={showCreateOrder}
          setShowFilter={setShowFilter}
          onCloseCreateOrder={closeCreateOrder}
          utils={{ ...utils, getExternalKamis: () => externalKamis }}
        />
        <MyOrders isVisible={tab === 'myOrders'} />
        <CreateOrder
          isVisible={showCreateOrder}
          onClose={closeCreateOrder}
          utils={{ ...utils, getExternalKamis: () => externalKamis }}
          createSellOrder={createSellOrder}
          createBuyOrder={createBuyOrder}
          createBuyKamiOrder={createBuyKamiOrder}
        />
        <FilterBy isVisible={showFilter} onClose={closeFilter} utils={utils} />
      </ModalWrapper>
    );
  },
};
