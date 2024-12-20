import { EntityIndex } from '@mud-classic/recs';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getKami } from 'app/cache/kami';
import { InputSingleTextForm, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { Kami, queryKamiByIndex } from 'network/shapes/Kami';
import { NullKami } from 'network/shapes/Kami/constants';
import { useEffect, useState } from 'react';

export function registerNameKamiModal() {
  registerUIComponent(
    'NameKami',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 39,
      rowEnd: 63,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const kamiRefreshOptions = { live: 2, flags: 5 };

          return {
            network,
            utils: {
              queryKamiByIndex: (index: number) => queryKamiByIndex(world, components, index),
              getKami: (entity: EntityIndex) =>
                getKami(world, components, entity, kamiRefreshOptions),
            },
          };
        })
      ),

    // Render
    ({ network, utils }) => {
      const { actions, api } = network;
      const { getKami, queryKamiByIndex } = utils;
      const { setModals } = useVisibility();
      const { kamiIndex } = useSelected();

      const [kami, setKami] = useState<Kami>(NullKami);

      /////////////////
      // SUBSCRIPTIONS

      useEffect(() => {
        const kamiEntity = queryKamiByIndex(kamiIndex);
        const kami = kamiEntity ? getKami(kamiEntity) : NullKami;
        setKami(kami);
      }, [kamiIndex]);

      /////////////////
      // ACTIONS

      // queue the naming action up
      const nameKami = (kami: Kami, name: string) => {
        actions.add({
          action: 'KamiName',
          params: [kami.id, name],
          description: `Renaming ${kami.name} to ${name}`,
          execute: async () => {
            return api.player.pet.name(kami.id, name);
          },
        });
      };

      // handle naming action response (need to modify for error handling)
      const handleNameTx = async (kami: Kami, name: string) => {
        try {
          nameKami(kami, name);
          setModals({ nameKami: false });
        } catch (e) {}
      };

      /////////////////
      // RENDER

      return (
        <ModalWrapper id='nameKami' canExit>
          <Title>Name your Kami</Title>
          <Description>A Kami can only be named once for free.</Description>
          <Description>Choose wisely.</Description>
          <Form>
            <InputSingleTextForm
              label={`rename ${kami?.name}`}
              placeholder={kami ? kami.name : ''}
              onSubmit={(v: string) => handleNameTx(kami, v)}
              fullWidth
              hasButton
            />
          </Form>
        </ModalWrapper>
      );
    }
  );
}

const Title = styled.div`
  color: #333;
  padding: 1.5vw;
  font-size: 1.5vw;
  text-align: center;
`;

const Description = styled.div`
  color: #333;
  font-size: 0.7vw;
  line-height: 1.2vw;
  text-align: center;
`;

const Form = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin: 1.2vw;
`;
