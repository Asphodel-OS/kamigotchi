import React from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID } from '@latticexyz/recs';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { SingleInputTextForm } from 'layers/react/components/library/SingleInputTextForm';
import { registerUIComponent } from 'layers/react/engine/store';
import { Kami, getKami } from 'layers/react/shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';
import 'layers/react/styles/font.css';

export function registerNameKamiModal() {
  registerUIComponent(
    'NameKami',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 30,
      rowEnd: 57,
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
      const handleNameTx = async (name: string) => {
        try {
          nameTx(kami, name);
          setVisibleModals({ ...visibleModals, nameKami: false });
        } catch (e) { }
      };

      return (
        <ModalWrapperFull
          id='name_kami_modal'
          divName='nameKami'
          canExit
        >
          <Title>Name your Kami</Title>
          <Description>A Kami can only be named once. Choose wisely.</Description>
          <SingleInputTextForm
            id={`kami-name`}
            label='new name'
            placeholder={kami.name}
            onSubmit={(v: string) => handleNameTx(v)}
            fullWidth
            hasButton
          />
        </ModalWrapperFull>
      );
    }
  );
}

const Title = styled.div`
  color: #333;
  padding: 1.5vw;

  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;

const Description = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: .7vw;
  text-align: center;
`;