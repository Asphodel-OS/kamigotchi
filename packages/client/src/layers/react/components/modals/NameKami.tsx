/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState, useCallback } from 'react';
import 'layers/react/styles/font.css';
import { map, merge } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import styled, { keyframes } from 'styled-components';
import { EntityID } from '@latticexyz/recs';
import { dataStore } from 'layers/react/store/createStore';
import { Stepper } from '../library/Stepper';
import { ModalWrapperFull } from '../library/ModalWrapper';
import { Kami, getKami } from 'layers/react/shapes/Kami';

export function registerNameKamiModal() {
  registerUIComponent(
    'NameKami',
    {
      colStart: 34,
      colEnd: 68,
      rowStart: 20,
      rowEnd: 50,
    },
    (layers) => {
      const {
        network: {
          api: { player },
          components: {
            CanName,
            OperatorAddress,
            Name
          },
          world: { entities },
          actions,
        },
      } = layers;

      return merge(
        OperatorAddress.update$,
        CanName.update$,
        Name.update$
      ).pipe(
        map(() => {
          return {
            layers,
            actions,
            api: player,
          };
        })
      );
    },

    ({ layers, actions, api }) => {
      const { selectedEntities, visibleModals, setVisibleModals } = dataStore();
      const kami = getKami(layers, selectedEntities.kami);
      const [name, setName] = useState('');

      // Set the previous name on input.
      // useEffect(() => {
      //   setName(kami?.name);
      // }, [kami]);

      // queue the naming action up
      const nameTx = (kami: Kami, name: string) => {
        const actionID = `Renaming ${kami.name}` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.pet.name(kami.id, name);
          },
        });
        return actionID;
      };

      // handle naming action response (need to modify for error handling)
      const NameKami = async () => {
        try {
          nameTx(kami, name);
          setVisibleModals({ ...visibleModals, nameKami: false });
          setName('');
        } catch (e) {
          //
        }
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          NameKami();
        }
        // This is for input ---
        // if (event.key === 'Escape') {
        //   setVisibleModals({ ...visibleModals, nameKami: false });
        // }
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
          />
        </ModalWrapperFull>
      );
    }
  );
}



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

  const { selectedEntities: { kami }, visibleModals, setVisibleModals } = dataStore();

  const hideModal = useCallback(() => {
    setVisibleModals({ ...visibleModals, nameKami: false });
  }, [setVisibleModals, visibleModals]);

  return (
    <ModalContent>
      <AlignRight style={{ gridRow: 1, marginBottom: '10px' }}>
        <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
          X
        </TopButton>
      </AlignRight>
      <Description style={{ gridRow: 2 }}>A Kami can only be named once. Choose carefully.</Description>
      <Input
        style={{ gridRow: 3, pointerEvents: 'auto' }}
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
    content: (
      <StepTwo catchKeys={props.catchKeys} handleChange={props.handleChange} name={props.name} />
    ),
    modalContent: true,
  },
];

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
  width: 99%;
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

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
`;

const AlignRight = styled.div`
  text-align: left;
  margin: 0px;
`;
