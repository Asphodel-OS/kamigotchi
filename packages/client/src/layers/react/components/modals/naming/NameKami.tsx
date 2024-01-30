import React from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";

import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { InputSingleTextForm } from 'layers/react/components/library/InputSingleTextForm';
import { registerUIComponent } from 'layers/react/engine/store';
import { Kami, getKamiByIndex } from 'layers/network/shapes/Kami';
import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';
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

    // Requirement
    (layers) => interval(1000).pipe(map(() => {
      return { network: layers.network };
    })),

    // Render
    ({ network }) => {
      const { actions, api } = network;
      const { modals, setModals } = useVisibility();
      const { kamiIndex } = useSelected();
      const kami = getKamiByIndex(network, kamiIndex);

      // queue the naming action up
      const nameKami = (kami: Kami, name: string) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiName',
          params: [kami.id, name],
          description: `Renaming ${kami.name}`,
          execute: async () => {
            return api.player.pet.name(kami.id, name);
          },
        });
        return actionID;
      };

      // handle naming action response (need to modify for error handling)
      const handleNameTx = async (name: string) => {
        try {
          nameKami(kami, name);
          setModals({ ...modals, nameKami: false });
        } catch (e) { }
      };

      return (
        <ModalWrapper
          id='name_kami_modal'
          divName='nameKami'
          canExit
        >
          <Title>Name your Kami</Title>
          <Description>A Kami can only be named once. Choose wisely.</Description>
          <InputSingleTextForm
            id={`kami-name`}
            label='new name'
            placeholder={kami.name}
            onSubmit={(v: string) => handleNameTx(v)}
            fullWidth
            hasButton
          />
        </ModalWrapper>
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