import { EntityID } from '@mud-classic/recs';
import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { Address, getAddress } from 'viem';
import { useWatchBlockNumber } from 'wagmi';

import { getConfigAddress } from 'app/cache/config';
import { getItemByIndex } from 'app/cache/item';
import { ModalWrapper, TextTooltip } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useNetwork, useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { ETH_INDEX } from 'constants/items';
import { useERC20Balance, usePresaleInfo } from 'network/chain';
import { Info } from './controls/Info';
import { Footer } from './Footer';
import { Header } from './Header';

const StartTime = 1745845200; // April 28th, 2025 – 1pm GMT
const EndTime = StartTime + 3600 * 24 * 2;

export const Presale: UIComponent = {
  id: 'Presale',
  Render: () => {
    const layers = useLayers();
    
    const { network, presaleAddress, currency } = useMemo(() => {
      const { network } = layers;
      const { world, components } = network;
      return {
        network,
        presaleAddress: getAddress(getConfigAddress(world, components, 'ONYX_PRESALE_ADDRESS')),
        currency: getItemByIndex(world, components, ETH_INDEX),
      };
    }, [layers]);

      const { selectedAddress, apis } = useNetwork();
      const { actions } = network;

      const { modals } = useVisibility();
      const [tick, setTick] = useState(Date.now());

      // ticking
      useEffect(() => {
        const tick = () => setTick(Math.floor(Date.now() / 1000));
        const timerID = setInterval(tick, 1000);
        return () => clearInterval(timerID);
      }, []);

      useWatchBlockNumber({
        onBlockNumber: () => {
          if (modals.presale) {
            refetchInfo();
            refetchToken();
          }
        },
      });

      /////////////////
      // PRESALE INFO

      const { refetch: refetchInfo, data: presaleData } = usePresaleInfo(
        selectedAddress as Address,
        presaleAddress
      );

      /////////////////
      // TOKEN BALANCES

      const { balances: currencyBal, refetch: refetchToken } = useERC20Balance(
        selectedAddress as Address,
        getAddress(currency.address || '0x0000000000000000000000000000000000000000'),
        presaleAddress
      );

      ////////////////
      // TRANSACTIONS

      const approveTx = async (quantity: number) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);
        const checksumAddr = getAddress(currency.address!);
        const checksumSpender = getAddress(presaleAddress);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Approve token',
          params: [checksumAddr, checksumSpender, quantity],
          description: `Approve ${quantity} ${currency.name} to be spent`,
          execute: async () => {
            return api.erc20.approve(checksumAddr, checksumSpender, quantity);
          },
        });
      };

      const buyTx = async (quantity: number) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Buy ONYX Presale',
          params: [quantity],
          description: `Buying ${quantity / presaleData.price} ONYX via presale`,
          execute: async () => {
            return api.presale.buy(presaleAddress, quantity);
          },
        });
      };

      const openOnyxDocs = () => {
        window.open('https://docs.kamigotchi.io/onyx', '_blank');
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper id='presale' footer={<Footer data={presaleData} />} noPadding overlay>
          <Container>
            <Header time={{ now: tick, start: StartTime, end: EndTime }} />
            <Content>
              <OnyxColumn>
                <TextTooltip
                  text={['What is $ONYX?', '', "Wouldn't you like to know."]}
                  alignText='center'
                >
                  <Image src={ItemImages.onyx} onClick={openOnyxDocs} />
                </TextTooltip>
              </OnyxColumn>
              <Info
                actions={{ approve: approveTx, buy: buyTx }}
                data={presaleData}
                tokenBal={currencyBal}
                time={{ now: tick, start: StartTime, end: EndTime }}
              />
            </Content>
          </Container>
        </ModalWrapper>
      );
  },
};

const Container = styled.div`
  background-color: #1d3441;
  height: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;

  user-select: none;
`;

const Content = styled.div`
  width: 100%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  flex-grow: 1;
`;

const OnyxColumn = styled.div`
  width: 24vw;
  height: 32vh;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const Image = styled.img`
  height: 24vh;
  max-height: 15vw;
  margin: 1.2vw;
  background-color: transparent;

  image-rendering: pixelated;
  filter: drop-shadow(-0.9vh -0.9vh 0.9vh #fff) drop-shadow(0.9vh 0.9vh 0.9vh #d0fe41)
    drop-shadow(0 0 0.6vh #fff);

  user-select: none;

  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;
