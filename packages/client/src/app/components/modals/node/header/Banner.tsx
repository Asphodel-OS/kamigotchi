import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconListButton, Tooltip } from 'app/components/library';
import { harvestIcon } from 'assets/images/icons/actions';
import { rooms } from 'constants/rooms';
import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Condition } from 'network/shapes/Conditional';
import { canHarvest, isResting, Kami, KamiOptions, onCooldown } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { ScavBar } from 'network/shapes/Scavenge';
import { DetailedEntity, getAffinityImage } from 'network/shapes/utils';
import { ScavengeBar } from './ScavengeBar';

interface Props {
  account: Account;
  node: Node;
  kamiEntities: EntityIndex[];
  actions: {
    scavClaim: (scavBar: ScavBar) => void;
    addKami: (kami: Kami) => void;
  };
  utils: {
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
    passesNodeReqs: (kami: Kami) => boolean;
    parseConditionalText: (condition: Condition, tracking?: boolean) => string;
    getScavPoints: () => number;
    getScavBar: () => ScavBar | undefined;
    parseAllos: (scavAllo: Allo[], flatten?: boolean) => DetailedEntity[];
  };
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current harvest or death as well as support common actions.
export const Banner = (props: Props) => {
  const { account, node, kamiEntities, utils, actions } = props;
  const { scavClaim, addKami } = actions;
  const [scavBar, setScavBar] = useState<ScavBar | undefined>(undefined);
  const [kamis, setKamis] = useState<Kami[]>([]);

  /////////////////
  // TRACKING

  // update the scav bar whenever the node changes
  useEffect(() => {
    const newScavBar = utils.getScavBar();
    setScavBar(newScavBar);
  }, [node.index]);

  useEffect(() => {
    const newKamis = kamiEntities.map((entity) => utils.getKami(entity));
    setKamis(newKamis);
  }, [kamiEntities]);

  // update the scavbar for its points every onc

  /////////////////
  // INTERPRETATION

  const getDisabledReason = (kamis: Kami[]): string => {
    let reason = '';
    let available = [...kamis];

    if (account.roomIndex !== node.roomIndex) reason = 'node too far!';
    if (available.length == 0) reason = 'you have no kamis!';

    available = available.filter((kami) => isResting(kami));
    if (available.length == 0 && reason === '') reason = 'you have no resting kami!';

    available = available.filter((kami) => !onCooldown(kami));
    if (available.length == 0 && reason === '') reason = 'your kami are on cooldown!';

    available = available.filter((kami) => utils.passesNodeReqs(kami));
    if (available.length == 0 && reason === '') reason = 'your kami do not meet node requirements!';

    return reason;
  };

  const canAdd = (kami: Kami) => {
    return canHarvest(kami) && utils.passesNodeReqs(kami);
  };

  /////////////////
  // RENDERING

  // button for adding Kami to node
  const AddButton = (kamis: Kami[]) => {
    const options = kamis.filter((kami) => canAdd(kami));
    const actionOptions = options.map((kami) => {
      return { text: `${kami.name}`, onClick: () => addKami(kami) };
    });

    return (
      <Tooltip text={[getDisabledReason(kamis)]} grow>
        <IconListButton
          key={`harvest-add`}
          img={harvestIcon}
          options={actionOptions}
          text='Add Kami to Node'
          disabled={options.length == 0 || account.roomIndex !== node.roomIndex}
          fullWidth
        />
      </Tooltip>
    );
  };

  const NodeImage = () => {
    if (!rooms[node.index] && node.index == 0) return <div />;
    const url = rooms[node.index].backgrounds[0];
    return <Image src={url} />;
  };

  // expected max 1 requirement for now
  const RequirementText = () => {
    if (node.requirements.length == 0) return <div />;
    return (
      <Footer>
        <FooterText>{utils.parseConditionalText(node.requirements[0], false)}</FooterText>
      </Footer>
    );
  };

  const ItemDrops = () => {
    const nodeDrops = node.drops;
    const drops = utils.parseAllos(scavBar?.rewards ?? []);
    const dropsFlat = utils.parseAllos(scavBar?.rewards ?? [], true);
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

  return (
    <Container key={node.name}>
      <Content>
        {NodeImage()}
        <Details>
          <Name>{node.name}</Name>
          <Row>
            <Label>Type: </Label>
            <Tooltip text={[node.affinity ?? '']}>
              <Icon src={getAffinityImage(node.affinity)} />
            </Tooltip>
            {ItemDrops()}
          </Row>
          <Description>{node.description}</Description>
        </Details>
        {RequirementText()}
      </Content>
      <ButtonRow>{AddButton(kamis)}</ButtonRow>
      {scavBar && (
        <ScavengeBar
          scavBar={scavBar}
          actions={{ claim: scavClaim }}
          utils={{ getPoints: utils.getScavPoints }}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  color: black;
  padding: 0.6vw;
  gap: 0.3vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Content = styled.div`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const Image = styled.img`
  border-radius: 0.6vw;
  border: solid black 0.15vw;
  height: 11vw;
  width: 11vw;
`;

const Details = styled.div`
  padding: 0.6vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Name = styled.div`
  font-size: 1.2vw;
  padding: 0.5vw 0;
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

const Label = styled.div`
  font-size: 0.75vw;
  color: #666;
  text-align: left;
  padding-left: 0.3vw;
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
`;

const Description = styled.div`
  font-size: 0.75vw;
  line-height: 1.1vw;
  text-align: left;
  padding: 0.45vw 0.3vw;
`;

const ButtonRow = styled.div`
  width: 100%;

  display: flex;
  flex-flow: row nowrap;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 0.1vw;

  display: flex;
  justify-content: flex-end;
`;

const FooterText = styled.div`
  font-family: Pixel;
  font-size: 0.6vw;
  text-align: right;
  color: #666;
`;
