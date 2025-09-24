import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Address } from 'viem';
import { Kamis } from '../party/Kamis';

export const PartyBottom = ({
  data,
  utils,
}: {
  data: { account: Account; kamiNFTAddress: Address };
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
    queryKamiByIndex: (index: number) => EntityIndex | undefined;
    getKami: (entity: EntityIndex) => Kami;
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
