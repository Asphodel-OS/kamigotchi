import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { getConfigAddress } from 'app/cache/config';
import { getKami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork, useVisibility } from 'app/stores';
import { MenuIcons } from 'assets/images/icons/menu';
import { erc721ABI } from 'network/chain/ERC721';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { Kami, queryKamiByIndex } from 'network/shapes/Kami';
import { Controls } from './Controls';
import { Mode } from './types';
import { WildKamis } from './WildKamis';
import { WorldKamis } from './WorldKamis';

export function registerKamiBridge() {
  registerUIComponent(
    'KamiBridge',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 15,
      rowEnd: 99,
    },
    (layers) => {
      return interval(1000).pipe(
        map(() => {
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
              account: getAccount(world, components, accountEntity),
              kamiNFTAddress: getConfigAddress(world, components, 'KAMI721_ADDRESS'),
            },
            utils: {
              queryKamiByIndex: (index: number) => queryKamiByIndex(world, components, index),
              getKami: (entity: EntityIndex) =>
                getKami(world, components, entity, kamiRefreshOptions),
              getAccountKamis: (accountEntity: EntityIndex) =>
                getAccountKamis(world, components, accountEntity, kamiRefreshOptions),
            },
          };
        })
      );
    },
    ({ data, network, utils }) => {
      const { actions } = network;
      const { kamiNFTAddress, account } = data;
      const { getAccountKamis, getKami, queryKamiByIndex } = utils;
      const { selectedAddress, apis } = useNetwork();
      const { modals } = useVisibility();

      const [worldKamis, setWorldKamis] = useState<Kami[]>([]);
      const [wildKamis, setWildKamis] = useState<Kami[]>([]);
      const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
      const [tick, setTick] = useState(Date.now());
      const [mode, setMode] = useState<Mode>('IMPORT');

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

      // ticking
      useEffect(() => {
        refetchNFTs();
        const tick = () => setTick(Math.floor(Date.now() / 1000));
        const timerID = setInterval(tick, 1000);
        return () => clearInterval(timerID);
      }, []);

      // clear out the selected kamis whenever the mode changes or the modal is opened
      useEffect(() => {
        if (!modals.bridgeERC721) return;
        setSelectedKamis([]);
      }, [modals.bridgeERC721, mode]);

      // refresh world kamis every tick
      useEffect(() => {
        if (!modals.bridgeERC721) return;
        const accountKamis = getAccountKamis(account.entity);
        setWorldKamis(accountKamis);
      }, [modals.bridgeERC721, tick]);

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
      const depositTx = (kamis: Kami[]) => {
        const api = apis.get(selectedAddress);
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

      // export a kami from the world to the wild
      const withdrawTx = (kamis: Kami[]) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const indices = kamis.map((kami) => kami.index);
        actions.add({
          action: 'KamiWithdraw',
          params: [kamis[0].index],
          description: `Unstaking Kami ${kamis[0].index}`,
          execute: async () => {
            return api.bridge.ERC721.kami.batch.unstake(indices);
          },
        });
      };

      /////////////////
      // RENDER

      return (
        <ModalWrapper
          id='bridgeERC721'
          header={<ModalHeader title='Kami Bridge' icon={MenuIcons.kami} />}
          canExit
          truncate
          noPadding
        >
          <WildKamis
            mode={mode}
            kamis={{ world: worldKamis, wild: wildKamis }}
            state={{ selected: selectedKamis, setSelected: setSelectedKamis }}
          />
          <Controls
            actions={{ import: depositTx, export: withdrawTx }}
            controls={{ mode, setMode }}
            state={{ selectedKamis }}
          />
          <WorldKamis
            mode={mode}
            kamis={{ world: worldKamis, wild: wildKamis }}
            state={{ selected: selectedKamis, setSelected: setSelectedKamis }}
          />
        </ModalWrapper>
      );
    }
  );
}
