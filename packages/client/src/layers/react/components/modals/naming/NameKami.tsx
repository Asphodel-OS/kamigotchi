import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';
import { Kami, getKami } from 'layers/network/shapes/Kami';
import { InputSingleTextForm } from 'layers/react/components/library/InputSingleTextForm';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/root';
import { useSelected, useVisibility } from 'layers/react/store';

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
    (layers) =>
      interval(1000).pipe(
        map(() => {
          return { network: layers.network };
        })
      ),

    // Render
    ({ network }) => {
      const { actions, api, components, world } = network;
      const { modals, setModals } = useVisibility();
      const { kamiIndex } = useSelected();
      const kami = getKami(world, components, kamiIndex as EntityIndex);

      // queue the naming action up
      const nameKami = (kami: Kami, name: string) => {
        actions.add({
          action: 'KamiName',
          params: [kami.id, name],
          description: `Renaming ${kami.name}`,
          execute: async () => {
            return api.player.pet.name(kami.id, name);
          },
        });
      };

      // handle naming action response (need to modify for error handling)
      const handleNameTx = async (name: string) => {
        try {
          nameKami(kami, name);
          setModals({ ...modals, nameKami: false });
        } catch (e) {}
      };

      return (
        <ModalWrapper id='name_kami_modal' divName='nameKami' canExit>
          <Title>Name your Kami</Title>
          <Description>A Kami can only be named once. Choose wisely.</Description>
          <InputSingleTextForm
            label='new name'
            placeholder={kami ? kami.name : ''}
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
  font-size: 0.7vw;
  text-align: center;
`;
