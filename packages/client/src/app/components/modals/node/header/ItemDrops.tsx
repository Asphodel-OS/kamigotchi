import { Tooltip } from 'app/components/library';
import { Allo } from 'network/shapes/Allo';
import { Node } from 'network/shapes/Node';
import { ScavBar } from 'network/shapes/Scavenge';
import { DetailedEntity } from 'network/shapes/utils';
import styled from 'styled-components';

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

  const nodeDrops = node.drops;
  const drops = parseAllos(scavenge?.rewards ?? []);
  const dropsFlat = parseAllos(scavenge?.rewards ?? []).flat();
  return (
    <Row>
      <Label>Drops: </Label>
      <Tooltip text={[nodeDrops[0]?.name ?? '']}>
        <Icon key={'node-' + nodeDrops[0]?.name} src={nodeDrops[0]?.image ?? ''} />
      </Tooltip>

      <Tooltip text={drops.map((entry) => entry.name + '\n' + entry.description)}>
        <Row style={{ borderLeft: 'solid #666 1px', paddingLeft: '0.3vw' }}>
          {dropsFlat.map((entry) => (
            <Icon key={'scav-' + entry.name} src={entry.image} />
          ))}
        </Row>
      </Tooltip>
    </Row>
  );
};

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

const Row = styled.div`
  width: 100%;
  padding: 0.03vw 0;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;
