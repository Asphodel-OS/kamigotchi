/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EntityIndex, HasValue, runQuery } from '@latticexyz/recs';
import React, { useEffect, useState, useCallback } from 'react';
import { map, merge, of } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount } from 'wagmi';

import { registerUIComponent } from 'layers/react/engine/store';
import mintSound from 'assets/sound/fx/tami_mint_vending_sound.mp3';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { Stepper } from '../library/Stepper';
import 'layers/react/styles/font.css';

export function registerAccountRegistrationModal() {
  registerUIComponent(
    'AccountRegistration',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 40,
      rowEnd: 60,
    },
    (layers) => {
      const {
        network: {
          components: { IsAccount, OwnerAddress },
        },
      } = layers;

      return merge(IsAccount.update$, OwnerAddress.update$).pipe(
        map(() => {
          return {
            layers,
          };
        })
      );
    },

    ({ layers }) => {
      const {
        network: {
          components: { OwnerAddress },
          network: { connectedAddress },
        },
      } = layers;
      const burnerAddress = connectedAddress.get();

      const { address: connectorAddress } = useAccount();
      const { volume } = dataStore((state) => state.sound);
      const { networks } = dataStore();
      const { visibleButtons, setVisibleButtons } = dataStore();
      const { visibleModals, setVisibleModals } = dataStore();

      const [connected, setConnected] = useState(false);
      const [hasAccount, setHasAccount] = useState(false);
      const { details, setDetails } = useKamiAccount();
      const [name, setName] = useState('');

      useEffect(() => {
        setConnected(!!connectorAddress);
        const detectedAccount = Array.from(
          runQuery([HasValue(OwnerAddress, { value: connectorAddress?.toLowerCase() })])
        )[0];
        console.log('Detected Account', detectedAccount);
        setHasAccount(!!detectedAccount);
      }, [connectorAddress]);
      console.log("connected?", connected);
      console.log("has Account?", hasAccount);


      // let detectedAccount = 0 as EntityIndex;
      // if( connected ) {
      // const detectedAccount = Array.from(
      //   runQuery([HasValue(OwnerAddress, { value: connectorAddress })])
      // )[0];
      // console.log(detectedAccount);
      // }

      // useEffect(() => {
      //   if (hasAccount) {
      //     setIsDivVisible(false);
      //     setVisibleModals({
      //       ...visibleModals,
      //       operatorInfo: true,
      //     });
      //     setVisibleButtons({
      //       ...visibleButtons,
      //       chat: true,
      //       help: true,
      //       map: true,
      //       party: true,
      //       settings: true,
      //     });
      //   } else {
      //     setIsDivVisible(true);
      //   }
      // }, [hasAccount]);

      // const handleMinting = useCallback(async (name) => {
      //   try {
      //     const soundFx = new Audio(mintSound);
      //     soundFx.volume = volume;
      //     soundFx.play();

      //     await player.account.set(connectedAddress.get()!, name);

      //     document.getElementById('accountRegistration')!.style.display = 'none';
      //   } catch (e) {

      //   }
      // }, []);

      // const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
      //   if (event.key === 'Enter') {
      //     handleMinting(name);
      //   }
      //   // if (event.keyCode === 27) {}
      // };

      // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      //   setName(event.target.value);
      // };



      return (
        <ModalWrapper id='accountRegistration' style={{ display: 'block' }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>{(connected) ? 'Connected' : 'Disconnected'} </Title>
            <Description>Account ID: {connectorAddress}</Description>
            <Description>Connector Address: {connectorAddress}</Description>
            <Description>Burner Address: {burnerAddress}</Description>
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Input = styled.input`
  width: 100%;

  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;
  margin: 10px 5px 5px 5px;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const ModalWrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;

const ModalContent = styled.div`
  display: grid;
  justify-content: center;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const Title = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;
