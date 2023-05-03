/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState, useCallback } from 'react';
import 'layers/react/styles/font.css';
import { map } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import styled, { keyframes } from 'styled-components';
import { HasValue, runQuery } from '@latticexyz/recs';
import mintSound from 'assets/sound/fx/tami_mint_vending_sound.mp3';
import { dataStore } from 'layers/react/store/createStore';
import { Modal } from 'antd';
import { Stepper } from '../library/Stepper';

export function registerDetectAccountModal() {
  registerUIComponent(
    'DetectMint',
    {
      colStart: 40,
      colEnd: 70,
      rowStart: 20,
      rowEnd: 60,
    },
    (layers) => {
      const {
        network: {
          components: { OperatorAddress },
        },
      } = layers;

      return OperatorAddress.update$.pipe(
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
          components: { OperatorAddress },
          api: { player },
          network: { connectedAddress },
        },
      } = layers;

      const [isDivVisible, setIsDivVisible] = useState(false);
      const [name, setName] = useState('');
      const { volume } = dataStore((state) => state.sound);

      const hasAccount = Array.from(
        runQuery([HasValue(OperatorAddress, { value: connectedAddress.get() })])
      )[0];

      const handleMinting = useCallback(async (name) => {
        try {
          const mintFX = new Audio(mintSound);

          mintFX.volume = volume;
          mintFX.play();

          await player.account.set(connectedAddress.get()!, name);

          document.getElementById('detectAccount')!.style.display = 'none';
          document.getElementById('mint_process')!.style.display = 'block';
        } catch (e) {
          //
        }
      }, []);

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          handleMinting(name);
        }
        // if (event.keyCode === 27) {}
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      };

      useEffect(() => {
        if (hasAccount != undefined) return setIsDivVisible(false);
        return setIsDivVisible(true);
      }, [setIsDivVisible, hasAccount]);

      return (
        <ModalWrapper id='detectAccount' style={{ display: isDivVisible ? 'block' : 'none' }}>
          <Stepper
            handleChange={handleChange}
            catchKeys={catchKeys}
            name={name}
            steps={steps}
            handleMinting={handleMinting}
            submit={true}
            handleSubmit={handleMinting}
          />
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

const Description = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const Header = styled.p`
  font-size: 24px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  font-family: Pixel;

  &:active {
    background-color: #c4c4c4;
  }
`;

const StepOne = () => (
  <ModalContent>
    <Description>
      <Header style={{ color: 'black' }}>Welcome!</Header>
      <br />
      Kamigotchi World exists entirely on-chain.
      <br />
      <br />
      It currently uses a burner wallet in your LocalStorage for testing.
    </Description>
  </ModalContent>
);

const StepTwo = () => (
  <ModalContent>
    <Description>
      <Header style={{ color: 'black' }}>Tips</Header>
      <br />
      You can move using the map.
      <br />
      <br />
      Look for a vending machine and for Nodes scattered throughout the world.
    </Description>
  </ModalContent>
);

const StepThree = (props: any) => {
  const { catchKeys, handleChange, name } = props;

  return (
    <ModalContent>
      <Description style={{ gridRow: 1 }}>
        Now, give yourself a name.
      </Description>
      <Input
        style={{ gridRow: 2, pointerEvents: 'auto' }}
        type='text'
        onKeyDown={(e) => catchKeys(e)}
        placeholder='username'
        value={name}
        onChange={(e) => handleChange(e)}
      ></Input>
    </ModalContent>
  );
};

const steps = (props: any) => [
  {
    title: 'One',
    content: <StepOne />,
  },
  {
    title: 'Two',
    content: <StepTwo />,
  },
  {
    title: 'Three',
    content: (
      <StepThree catchKeys={props.catchKeys} handleChange={props.handleChange} name={props.name} />
    ),
    modalContent: true,
  },
];
