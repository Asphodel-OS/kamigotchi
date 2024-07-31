import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconListButton, Tooltip } from 'app/components/library';
import { harvestIcon } from 'assets/images/icons/actions';
import { rooms } from 'constants/rooms';
import { Account } from 'network/shapes/Account';
import { Condition } from 'network/shapes/Conditional';
import { Kami, canHarvest, isResting, onCooldown } from 'network/shapes/Kami';
import { Node, NullNode } from 'network/shapes/Node';
import { getAffinityImage } from 'network/shapes/utils';

interface Props {
  account: Account;
  node: Node | undefined;
  kamis: Kami[];
  addKami: (kami: Kami) => void;
  utils: {
    passesNodeReqs: (kami: Kami) => boolean;
    parseConditionalText: (condition: Condition, tracking?: boolean) => string;
  };
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const Banner = (props: Props) => {
  const [_, setLastRefresh] = useState(Date.now());
  const { account, node: rawNode, kamis, utils } = props;
  const [node, setNode] = useState<Node>(NullNode);

  /////////////////
  // TRACKING

  // ticking
  useEffect(() => {
    const refreshClock = () => {
      setLastRefresh(Date.now());
    };
    const timerId = setInterval(refreshClock, 1000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    setNode(rawNode === undefined ? NullNode : rawNode);
  }, [rawNode]);

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
      return { text: `${kami.name}`, onClick: () => props.addKami(kami) };
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
          noBounce
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
            <Label>Drops: </Label>
            <Tooltip text={[node.drops[0]?.name ?? '']}>
              <Icon src={node.drops[0]?.image ?? ''} />
            </Tooltip>
          </Row>
          <Description>{node.description}</Description>
        </Details>
        {RequirementText()}
      </Content>
      <ButtonRow>{AddButton(kamis)}</ButtonRow>
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
  font-family: Pixel;
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
  font-family: Pixel;
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
