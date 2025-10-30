import { EntityID, EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { canHarvest, isResting, onCooldown } from 'app/cache/kami';
import { IconListButton, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { HarvestIcon } from 'assets/images/icons/actions';
import { rooms } from 'constants/rooms';
import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Condition } from 'network/shapes/Conditional';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { NullRoom, Room } from 'network/shapes/Room';
import { NullScavenge, ScavBar } from 'network/shapes/Scavenge';
import { DetailedEntity, getAffinityImage } from 'network/shapes/utils';
import { ItemDrops } from './ItemDrops';
import { ScavengeBar } from './ScavengeBar';

export const Header = ({
  data,
  actions,
  utils,
}: {
  data: {
    account: Account;
    node: Node;
    kamiEntities: EntityIndex[];
  };
  actions: {
    claim: (scavenge: ScavBar) => void;
    addKami: (kami: Kami) => void;
  };
  utils: {
    getAccountKamis: () => Kami[];
    getRoom: (index: number) => Room;
    getValue: (entity: EntityIndex) => number;
    parseAllos: (scavAllo: Allo[]) => DetailedEntity[];
    parseConditionalText: (condition: Condition, tracking?: boolean) => string;
    passesNodeReqs: (kami: Kami) => boolean;
    queryScavInstance: (index: number, holderID: EntityID) => EntityIndex | undefined;
  };
}) => {
  const { account, node } = data;
  const { addKami } = actions;
  const { getAccountKamis, getRoom, getValue } = utils;
  const { queryScavInstance } = utils;
  const { parseConditionalText, passesNodeReqs } = utils;

  const nodeModalVisible = useVisibility((s) => s.modals.node);
  const [kamis, setKamis] = useState<Kami[]>([]);
  const [room, setRoom] = useState<Room>(NullRoom);
  const [scavenge, setScavenge] = useState<ScavBar>(NullScavenge);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // set refresh rate on mount
  useEffect(() => {
    const refreshClock = () => setLastRefresh(Date.now());
    const refreshInterval = setInterval(refreshClock, 2000);
    return () => clearInterval(refreshInterval);
  }, []);

  // update the scavenge whenever the node changes
  useEffect(() => {
    if (!nodeModalVisible) return;

    const scavenge = node.scavenge;
    if (scavenge) setScavenge(scavenge);
    if (node.roomIndex !== room.index) setRoom(getRoom(node.roomIndex));
  }, [node.index, nodeModalVisible]);

  // keep the account kamis up to date whenever the modal is open
  useEffect(() => {
    if (nodeModalVisible) setKamis(getAccountKamis());
  }, [nodeModalVisible, lastRefresh]);

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

    available = available.filter((kami) => passesNodeReqs(kami));
    if (available.length == 0 && reason === '') reason = 'your kami do not meet node requirements!';

    return reason;
  };

  const getNodeImage = () => {
    const roomObject = rooms[node.roomIndex] ?? rooms[0];
    return roomObject.backgrounds[0];
  };

  const canAdd = (kami: Kami) => {
    return canHarvest(kami) && passesNodeReqs(kami);
  };

  /////////////////
  // RENDERING

  // button for adding Kami to node
  const AddButton = (kamis: Kami[]) => {
    const options = kamis.filter((kami) => canAdd(kami));
    const actionOptions = options.map((kami) => {
      return { text: `${kami.name}`, image: kami.image, onClick: () => addKami(kami) };
    });

    return (
      <IconListButton
        key={`harvest-add`}
        img={HarvestIcon}
        options={actionOptions}
        text='Add Kami to Node'
        disabled={options.length == 0 || account.roomIndex !== node.roomIndex}
        fullWidth
        tooltip={{ text: [getDisabledReason(kamis)], grow: true }}
      />
    );
  };

  return (
    <Container>
      <Content>
        <Image src={getNodeImage()} />
        <Details>
          <Name>{room.name}</Name>
          <Row>
            <Label>Type: </Label>
            <TextTooltip text={[node.affinity ?? '']}>
              <Icon src={getAffinityImage(node.affinity)} />
            </TextTooltip>
            <ItemDrops node={node} scavenge={scavenge} utils={utils} />
          </Row>
          <Description>{room.description}</Description>
        </Details>
        {node.requirements.length > 0 && (
          <Footer>
            <FooterText>{parseConditionalText(node.requirements[0], false)}</FooterText>
          </Footer>
        )}
      </Content>
      <ButtonRow>{AddButton(kamis)}</ButtonRow>
      {scavenge.entity != 0 && (
        <ScavengeBar
          scavenge={scavenge}
          actions={actions}
          utils={{
            getPoints: getValue,
            queryScavInstance: () => queryScavInstance(scavenge.index, account.id),
          }}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  color: black;
  padding: 0.6rem;
  gap: 0.3rem;
  display: flex;
  flex-flow: column nowrap;
  user-select: none;
`;

const Content = styled.div`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
`;

const Image = styled.img`
  border-radius: 0.6rem;
  border: solid black 0.15rem;
  height: 11rem;
  width: 11rem;
  user-drag: none;
`;

const Details = styled.div`
  padding: 0.6rem;
  display: flex;
  flex-flow: column nowrap;
`;

const Name = styled.div`
  font-size: 1.2rem;
  padding: 0.5rem 0;
`;

const Row = styled.div`
  width: 100%;
  padding: 0.03rem 0;
  gap: 0.3rem;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const Label = styled.div`
  font-size: 0.75rem;
  color: #666;
  text-align: left;
  padding-left: 0.3rem;
`;

const Icon = styled.img`
  height: 1.2rem;
  width: 1.2rem;
`;

const Description = styled.div`
  font-size: 0.75rem;
  line-height: 1.1rem;
  text-align: left;
  padding: 0.45rem 0.3rem;
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
  padding: 0.1rem;

  display: flex;
  justify-content: flex-end;
`;

const FooterText = styled.div`
  font-family: Pixel;
  font-size: 0.6rem;
  text-align: right;
  color: #666;
`;
