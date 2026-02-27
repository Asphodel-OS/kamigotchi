import { EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getAccount as _getAccount } from 'app/cache/account';
import { getConfigAddress } from 'app/cache/config';
import { getKami as _getKami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useNetwork, useVisibility } from 'app/stores';
import { MenuIcons } from 'assets/images/icons/menu';
import { erc721ABI } from 'network/chain/ERC721';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { Kami, queryKamiByIndex as _queryKamiByIndex } from 'network/shapes/Kami';
import { didActionSucceed } from 'network/utils';
import { Controls } from './Controls';
import { WildKamis } from './WildKamis';

export const KamiPortalModal: UIComponent = {
  id: 'KamiPortalModal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network, data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const kamiRefreshOptions = {
        live: 2,
        progress: 3600,
      };

      return {
        network,
        data: {
          account: _getAccount(world, components, accountEntity),
          kamiNFTAddress: getConfigAddress(world, components, 'KAMI721_ADDRESS'),
        },
        utils: {
          queryKamiByIndex: (index: number) => _queryKamiByIndex(world, components, index),
          getKami: (entity: EntityIndex) => _getKami(world, components, entity, kamiRefreshOptions),
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { actions } = network;
    const { kamiNFTAddress, account } = data;
    const { getKami, queryKamiByIndex } = utils;

    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const modals = useVisibility((s) => s.modals);

    const [wildKamis, setWildKamis] = useState<Kami[]>([]);
    const [selectedWild, setSelectedWild] = useState<Kami[]>([]);

    /////////////////
    // SUBSCRIPTIONS

    useWatchBlockNumber({ onBlockNumber: () => refetchNFTs() });

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

    // refetch NFTs on mount
    useEffect(() => {
      refetchNFTs();
    }, []);

    // clear out the selected kamis whenever the modal is opened
    useEffect(() => {
      if (!modals.bridgeERC721) return;
      setSelectedWild([]);
    }, [modals.bridgeERC721]);

    // update list of wild kamis
    // TOTO: properly typecast the result of the abi call
    useEffect(() => {
      const result = (nftData?.[0]?.result ?? []) as number[];
      const entities = result.map((index: number) => queryKamiByIndex(index));
      const filtered = entities.filter((entity) => !!entity) as EntityIndex[];
      const externalKamis = filtered.map((entity: EntityIndex) => getKami(entity));
      setWildKamis(externalKamis);
    }, [nftData]);

    /////////////////
    // TRANSACTIONS

    // import a kami from the wild to the world
    // TODO: pets without accounts are linked to EOA, no account. link EOA
    const depositTx = async (kamis: Kami[]) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const numKamis = kamis.length;
      const indices = kamis.map((kami) => kami.index);

      // determine the description based on number of kamis
      let description = '';
      if (numKamis == 1) description = `Staking ${kamis[0].name}`;
      else description = `Staking ${numKamis} Kami`;

      // add the transaction to the queue
      const tx = actions.add({
        action: 'KamiDeposit',
        params: indices,
        description,
        execute: async () => {
          return api.portal.ERC721.kami.batch.stake(indices);
        },
      });

      // reset array if successful
      const completed = await didActionSucceed(actions.Action, tx);
      if (completed) {
        setSelectedWild([]);
      }
    };

    /////////////////
    // RENDER

    return (
      <ModalWrapper
        id='bridgeERC721'
        header={<ModalHeader title='Kami Portal' icon={MenuIcons.kami} />}
        canExit
        noPadding
        overlay
      >
        <Container>
          <WildKamis kamis={wildKamis} state={{ selectedWild, setSelectedWild }} />
          <Controls
            actions={{ import: depositTx }}
            state={{ selectedWild, setSelectedWild }}
          />
        </Container>
      </ModalWrapper>
    );
  },
};

const Container = styled.div`
  position: relative;
  width: 100%;
  max-height: 100%;
  z-index: 2;

  display: flex;
  flex-flow: row nowrap;
`;
