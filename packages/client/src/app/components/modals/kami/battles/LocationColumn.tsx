import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kill } from 'clients/kamiden';
import { Node } from 'network/shapes';
import { getAffinityImage } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';
import { abbreviateString } from 'utils/strings';

export const LocationColumn = ({
  kills,
  utils,
}: {
  kills: Kill[];
  utils: {
    getNodeByIndex: (index: number) => Node;
  };
}) => {
  const { getNodeByIndex } = utils;
  const setNode = useSelected((s) => s.setNode);
  const { setModals } = useVisibility();

  const showNode = (node: Node) => {
    setNode(node.index);
    setModals({ node: true, crafting: false, kami: false });
    playClick();
  };

  return (
    <Container>
      <Text size={1.2}>Location</Text>
      {kills.map((kill, index) => {
        const node = getNodeByIndex(kill.RoomIndex as EntityIndex);
        return (
          <TextTooltip key={index} text={[node.name]}>
            <Row key={index} onClick={() => showNode(node)}>
              <Icon src={getAffinityImage(node.affinity)} />
              <Text size={0.9}> {abbreviateString(node.name)}</Text>
            </Row>
          </TextTooltip>
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
`;

const Row = styled.div`
  width: 100%;
  height: 2.1vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45vw;

  &:hover {
    cursor: pointer;
    background-color: rgb(221, 221, 221);
  }
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
`;
