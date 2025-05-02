import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { useReadContracts, useWatchBlockNumber } from 'wagmi';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { getConfigAddress } from 'app/cache/config';
import { getKami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork, useVisibility } from 'app/stores';
import { MenuIcons } from 'assets/images/icons/menu';
import { Kami, queryKamiByIndex } from 'network/shapes/Kami';

import { erc721ABI } from 'network/chain/ERC721';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
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
      rowStart: 3,
      rowEnd: 99,
    },
    (layers) => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const kamiRefreshOptions = {
        live: 2,
      };

      return interval(1000).pipe(
        map(() => {
          return {
            network,
            data: {
              account: getAccount(world, components, accountEntity),
              worldKamis: getAccountKamis(world, components, accountEntity, kamiRefreshOptions),
              kamiNFTAddress: getConfigAddress(world, components, 'KAMI721_ADDRESS'),
            },
            utils: {
              queryKamiByIndex: (index: number) => queryKamiByIndex(world, components, index),
              getKami: (entity: EntityIndex) =>
                getKami(world, components, entity, kamiRefreshOptions),
            },
          };
        })
      );
    },
    ({ data, network, utils }) => {
      const { actions } = network;
      const { kamiNFTAddress, account, worldKamis } = data;
      const { getKami, queryKamiByIndex } = utils;
      const { selectedAddress, apis } = useNetwork();
      const { modals } = useVisibility();

      const [wildKamis, setWildKamis] = useState<Kami[]>([]);
      const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
      const [tick, setTick] = useState(Date.now());
      const [mode, setMode] = useState<Mode>('IMPORT');

      /////////////////
      // SUBSCRIPTIONS

      // ticking
      useEffect(() => {
        const tick = () => setTick(Math.floor(Date.now() / 1000));
        const timerID = setInterval(tick, 1000);
        return () => clearInterval(timerID);
      }, []);

      useEffect(() => {
        setSelectedKamis([]);
      }, [modals.bridgeERC721, mode]);

      useWatchBlockNumber({
        onBlockNumber: (n) => {
          refetch();
        },
      });

      const { refetch, data: nftData } = useReadContracts({
        contracts: [
          {
            address: kamiNFTAddress,
            abi: erc721ABI,
            functionName: 'getAllTokens',
            args: [account.ownerAddress],
          },
        ],
      });

      // update list of wild kamis
      // TOTO: figure out how to properly typecast the result of the abi call
      useEffect(() => {
        const result = nftData?.[0]?.result as number[];
        const entities = (result?.map((index: number) => queryKamiByIndex(index)) ??
          []) as EntityIndex[];
        const externalKamis = entities.map((entity: EntityIndex) => getKami(entity));
        setWildKamis(externalKamis);
      }, [nftData]);

      /////////////////
      // TRANSACTIONS

      // import a kami from the wild to the world
      // TODO: pets without accounts are linked to EOA, no account. link EOA
      const depositTx = (kamis: Kami[]) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        actions.add({
          action: 'KamiDeposit',
          params: [kamis[0].index],
          description: `Staking Kami ${kamis[0].index}`,
          execute: async () => {
            return api.bridge.ERC721.deposit(kamis[0].index);
          },
        });
      };

      // export a kami from the world to the wild
      const withdrawTx = (kamis: Kami[]) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        actions.add({
          action: 'KamiWithdraw',
          params: [kamis[0].index],
          description: `Unstaking Kami ${kamis[0].index}`,
          execute: async () => {
            return api.bridge.ERC721.withdraw(kamis[0].index);
          },
        });
      };

      /////////////////
      // KAMI LOGIC

      const isImportable = (kami: Kami): boolean => {
        return isOutOfWorld(kami);
      };

      const isExportable = (kami: Kami): boolean => {
        return isResting(kami);
      };

      // naive check right now, needs to be updated with murder check as well
      const isDead = (kami: Kami): boolean => kami.state === 'DEAD';
      const isHarvesting = (kami: Kami): boolean =>
        kami.state === 'HARVESTING' && kami.harvest != undefined;
      const isResting = (kami: Kami): boolean => kami.state === 'RESTING';
      const isOutOfWorld = (kami: Kami): boolean => kami.state === '721_EXTERNAL';

      return (
        <ModalWrapper
          id='bridgeERC721'
          header={<ModalHeader title='Kami Bridge' icon={MenuIcons.kami} />}
          canExit
          truncate
          noPadding
        >
          <WorldKamis mode={mode} kamis={worldKamis} state={{ selectedKamis, setSelectedKamis }} />
          <Controls
            actions={{ import: depositTx, export: withdrawTx }}
            controls={{ mode, setMode }}
            state={{ selectedKamis }}
          />
          <WildKamis mode={mode} kamis={wildKamis} state={{ selectedKamis, setSelectedKamis }} />
        </ModalWrapper>
      );
    }
  );
}

const Container = styled.div`
  border-color: black;
  border-width: 2px;
  color: black;
  margin: 0px;
  padding: 0px;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;
