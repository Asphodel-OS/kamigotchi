import type { ComponentProps } from 'react';
import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Kami } from 'network/shapes/Kami';
import { Kamis } from '../party/Kamis';

export const PartyBottom = ({
  data,
  utils,
}: {
  data: ComponentProps<typeof Kamis>['data'];
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
  };
}) => {
  /////////////////
  // RENDERING

  return (
    <Container>
      <Kamis data={data} utils={utils} />
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0 0 0.6vw 0.6vw;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 0.45vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;

  overflow-y: auto;
`;
