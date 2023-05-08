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
import { ModalWrapperFull } from '../library/ModalWrapper';

export function registerNameKamiModal() {
  registerUIComponent(
    'NameKami',
    {
      colStart: 40,
      colEnd: 70,
      rowStart: 20,
      rowEnd: 43,
    },
    (layers) => {
      const {
        network: {
          components: { OperatorAddress },
          world: { entities },
        },
      } = layers;

      return OperatorAddress.update$.pipe(
        map(() => {
          return {
            layers,
            entities,
          };
        })
      );
    },

    ({ layers, entities }) => {
      const {
        network: {
          api: { player },
        },
      } = layers;

      // const [isDivVisible, setIsDivVisible] = useState(false);
      const [name, setName] = useState('');
      const {
        selectedEntities: { kami },
      } = dataStore();

      const NameKami = useCallback(async (selectedKami, name) => {
        try {
          await player.ERC721.name(entities[selectedKami], name);

          document.getElementById('name_kami_modal')!.style.display = 'none';
        } catch (e) {
          //
        }
      }, []);

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          NameKami(kami, name);
        }
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      };

      return (
        <ModalWrapperFull id='name_kami_modal' divName='nameKami' fill={false}>
          <Stepper
            handleChange={handleChange}
            catchKeys={catchKeys}
            name={name}
            steps={steps}
            handleMinting={NameKami}
            submit={true}
            handleSubmit={NameKami}
            kami={true}
            selectedKami={kami}
          />
        </ModalWrapperFull>
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
      <br />
      Once you set a name for your Kami, that name is permanent.
      <br />
    </Description>
  </ModalContent>
);

const StepTwo = (props: any) => {
  const { catchKeys, handleChange, name } = props;

  return (
    <ModalContent>
      <Description style={{ gridRow: 1 }}>Now, give kami a name.</Description>
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
    content: (
      <StepTwo catchKeys={props.catchKeys} handleChange={props.handleChange} name={props.name} />
    ),
    modalContent: true,
  },
];
