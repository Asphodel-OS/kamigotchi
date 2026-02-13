import { useState } from 'react';

import { getAccountKamis as _getAccountKamis } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useNetwork } from 'app/stores';
import VendIcon from 'assets/images/rooms/18_cave-crossroads/vend.png';
import { BigNumberish } from 'ethers';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getAllKamis as _getAllKamis } from 'network/shapes/Kami';
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
      network: { actions, api },
    } = (() => {
      const { network } = useLayers();
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);

      return {
        utils: {
          getAccountKamis: () => _getAccountKamis(world, components, accountEntity),
          getAllKamis: () => _getAllKamis(world, components),
          getRegistryTraits: (specificType?: TraitType[]) =>
            _getRegistryTraits(world, components, specificType),
        },
        network,
      };
    })();
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);

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
          utils={utils}
        />
        <MyOrders isVisible={tab === 'myOrders'} />
        <CreateOrder
          isVisible={showCreateOrder}
          onClose={closeCreateOrder}
          utils={utils}
          createSellOrder={createSellOrder}
          createBuyOrder={createBuyOrder}
          createBuyKamiOrder={createBuyKamiOrder}
        />
        <FilterBy isVisible={showFilter} onClose={closeFilter} utils={utils} />
      </ModalWrapper>
    );
  },
};
