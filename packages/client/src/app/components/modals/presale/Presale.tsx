import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { Address, getAddress } from 'viem';

import { EntityID } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { getConfigAddress } from 'app/cache/config';
import { getItemByIndex } from 'app/cache/item';
import { ModalWrapper, Overlay, ProgressBar, Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { ETH_INDEX } from 'constants/items';
import { useERC20Balance, usePresaleInfo } from 'network/chain';
import { useWatchBlockNumber } from 'wagmi';
import { Info } from './controls/Info';

const StartTime = Math.floor(Date.now() / 1000) + 3600 * 24;

export function registerPresaleModal() {
  registerUIComponent(
    'Presale',
    {
      colStart: 25,
      colEnd: 75,
      rowStart: 25,
      rowEnd: 75,
    },

    // Requirement
    (layers) => {
      return interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          return {
            network,
            presaleAddress: getAddress(getConfigAddress(world, components, 'ONYX_PRESALE_ADDRESS')),
            currency: getItemByIndex(world, components, ETH_INDEX),
          };
        })
      );
    },

    // Render
    ({ network, presaleAddress, currency }) => {
      const { selectedAddress, apis } = useNetwork();
      const { actions } = network;

      const [tick, setTick] = useState(Date.now());

      // ticking
      useEffect(() => {
        const tick = () => setTick(Date.now());
        const timerID = setInterval(tick, 1000);
        return () => clearInterval(timerID);
      }, []);

      useWatchBlockNumber({
        onBlockNumber: () => {
          refetchInfo();
          refetchToken();
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
          description: `Buying ${quantity * presaleData.price} ONYX via presale`,
          execute: async () => {
            return api.presale.buy(presaleAddress, quantity);
          },
        });
      };

      // const updateInput = (value: number) => {
      //   setToBuy(value);
      //   setToReceive(value * presaleData.price);
      // };

      const openOnyxDocs = () => {
        window.open('https://docs.kamigotchi.io/onyx', '_blank');
      };

      ////////////////
      // COMPONENTS

      // const MockUpData = () => {
      //   return (
      //     <Data>
      //       <Numbers style={{ marginBottom: `0.2vw` }}>Your allo: {presaleData.allo}</Numbers>
      //       <Numbers style={{ marginBottom: `0.8vw` }}>You bought: {presaleData.bought}</Numbers>
      //     </Data>
      //   );
      // };

      // const InputBox = () => {
      //   return (
      //     <InputButton>
      //       <Input
      //         type='number'
      //         min='0'
      //         onKeyDown={(e) => {
      //           if (e.key === '-') e.preventDefault();
      //         }}
      //         ref={inputRef}
      //         onChange={(e) => updateInput(Number(e.target.value))}
      //       />
      //       <ActionButton
      //         text={enoughApproval() ? 'Buy' : 'Approve'}
      //         disabled={!enoughCurrency()}
      //         onClick={() => (enoughApproval() ? buyTx(toBuy) : approveTx(toBuy))}
      //       />
      //     </InputButton>
      //   );
      // };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='presale'
          footer={<ProgressBar current={presaleData.totalDeposits} max={presaleData.depositCap} />}
          // header={<ModalHeader title='Presale' icon={ItemImages.onyx} />}
          noPadding
          overlay
        >
          <Container>
            <Overlay left={0.9} top={0.9}>
              <Text size={1.2}>Mint is Live</Text>
            </Overlay>
            {/* <Overlay right={0.9} top={0.9}>
              <Text size={1.2}>Mint is Live</Text>
            </Overlay> */}
            <Title>$ONYX Presale</Title>
            <Content>
              <OnyxColumn>
                <Tooltip
                  text={['What is $ONYX?', '', 'Click to find out more!']}
                  alignText='center'
                >
                  <Image src={ItemImages.onyx} onClick={openOnyxDocs} />
                </Tooltip>
              </OnyxColumn>
              <Info
                actions={{ approve: approveTx, buy: buyTx }}
                data={presaleData}
                tokenBal={currencyBal}
              />
            </Content>
          </Container>
        </ModalWrapper>
      );
    }
  );
}

const Container = styled.div`
  gap: 0.6vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-evenly;
  align-items: center;
`;

const Content = styled.div`
  width: 100%;
  height: 50%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const OnyxColumn = styled.div`
  width: 24vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const Title = styled.div`
  font-size: 2.7vw;
  margin-top: 1.8vw;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;

const Image = styled.img`
  height: 21vh;
  max-height: 15vw;
  image-rendering: pixelated;

  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;
