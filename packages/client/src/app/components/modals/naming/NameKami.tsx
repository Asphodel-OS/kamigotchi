import { EntityIndex } from '@mud-classic/recs';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { InputSingleTextForm, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { Kami, getKami } from 'network/shapes/Kami';

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
          setModals({ nameKami: false });
        } catch (e) {}
      };

      return (
        <ModalWrapper id='nameKami' canExit>
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
