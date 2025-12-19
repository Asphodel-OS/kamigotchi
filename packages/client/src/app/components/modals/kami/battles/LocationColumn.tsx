import { EntityIndex } from 'engine/recs';
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
  const setModals = useVisibility((s) => s.setModals);

  const showNode = (node: Node) => {
    const isMobile = window.matchMedia('(max-aspect-ratio: 11/16)').matches;

    setNode(node.index);
    setModals({
      node: true,
      crafting: false,
      ...(isMobile && { kami: false, party: false }),
    });
    playClick();
  };

  return (
    <Container>
      <Header>Location</Header>
      {kills.map((kill, index) => {
        const node = getNodeByIndex(kill.RoomIndex as EntityIndex);
        return (
          <TextTooltip key={index} text={[node.name]}>
            <Row onClick={() => showNode(node)}>
              {node.affinity.map((aff, i) => (
                <Icon key={i} src={getAffinityImage(aff)} />
              ))}
              <Text size={0.9}>{abbreviateString(node.name)}</Text>
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
  gap: 0.3em;
  min-width: 0;
  flex: 1 1 auto;
`;

const Header = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  white-space: normal;
  word-break: break-word;
  height: 2em;
  border-bottom: solid black 0.1em;
`;

const Row = styled.div`
  width: 100%;
  min-height: 2.1em;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45em;
  white-space: normal;
  word-break: break-word;

  &:hover {
    cursor: pointer;
    background-color: rgb(221, 221, 221);
  }
`;

const Icon = styled.img`
  height: 1.2em;
  width: 1.2em;
`;
