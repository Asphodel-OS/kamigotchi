import { EntityID } from '@mud-classic/recs';
import styled from 'styled-components';

import { Text } from 'app/components/library';
import { useSelected } from 'app/stores';
import { Kill } from 'clients/kamiden';
import { Kami } from 'network/shapes';
import { playClick } from 'utils/sounds';

export const AdversaryColumn = ({
  kills,
  utils,
}: {
  kills: Kill[];
  utils: {
    getKamiByID: (id: EntityID) => Kami;
  };
}) => {
  const { getKamiByID } = utils;
  const { setKami } = useSelected();

  const selectKami = (index: number) => {
    setKami(index);
    playClick();
  };

  return (
    <Container>
      <Text size={1.2}>Adversary</Text>
      {kills.map((kill, index) => {
        const adversaryId = kill.IsDeath ? kill.KillerId : kill.VictimId;
        const adversary = getKamiByID(adversaryId as EntityID);
        return (
          <Row key={index} onClick={() => selectKami(adversary.index)}>
            <Text size={0.9}>{adversary.name}</Text>
          </Row>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  display: flex;

  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.3vw;

  overflow-x: hidden;
`;

const Row = styled.div`
  width: 100%;
  height: 2.1vw;
  gap: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  &:hover {
    cursor: pointer;
    opacity: 0.8;
  }
`;
