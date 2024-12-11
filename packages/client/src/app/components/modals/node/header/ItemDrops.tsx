import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Allo } from 'network/shapes/Allo';
import { Node } from 'network/shapes/Node';
import { ScavBar } from 'network/shapes/Scavenge';
import { DetailedEntity } from 'network/shapes/utils';

interface Props {
  node: Node;
  scavenge: ScavBar;
  utils: {
    parseAllos: (scavAllo: Allo[]) => DetailedEntity[];
  };
}

export const ItemDrops = (props: Props) => {
  const { node, scavenge, utils } = props;
  const { parseAllos } = utils;
  const [drops, setDrops] = useState<DetailedEntity[]>([]);
  const nodeDrops = node.drops;

  useEffect(() => {
    const drops = parseAllos(scavenge?.rewards ?? []);
    setDrops(drops);
  }, [scavenge]);

  return (
    <Container>
      <Label>Drops: </Label>
      <Tooltip text={[nodeDrops[0]?.name ?? '']}>
        <Icon key={'node-' + nodeDrops[0]?.name} src={nodeDrops[0]?.image ?? ''} />
      </Tooltip>

      <Tooltip text={drops.map((entry) => `${entry.name} [${entry.description}]`)}>
        <Row>
          {drops.map((entry) => (
            <Icon key={'scav-' + entry.name} src={entry.image} />
          ))}
        </Row>
      </Tooltip>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0.03vw 0;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const Row = styled.div`
  border-left: solid #666 0.1vw;

  width: 100%;
  padding: 0.03vw 0;
  padding-left: 0.3vw;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
`;

const Label = styled.div`
  font-size: 0.75vw;
  color: #666;
  text-align: left;
  padding-left: 0.3vw;
`;
