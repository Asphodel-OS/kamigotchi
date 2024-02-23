import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { harvestIcon } from 'assets/images/icons/actions';
import { NodeImages } from 'constants/nodes';
import { Account } from 'layers/network/shapes/Account';
import { Kami, canHarvest, isResting, onCooldown } from 'layers/network/shapes/Kami';
import { Node } from 'layers/network/shapes/Node';
import { IconListButton } from 'layers/react/components/library/IconListButton';
import { Tooltip } from 'layers/react/components/library/Tooltip';

interface Props {
  account: Account;
  node: Node;
  kamis: Kami[];
  addKami: (kami: Kami) => void;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const Banner = (props: Props) => {
  const [_, setLastRefresh] = useState(Date.now());
  const { account, node, kamis } = props;

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

  /////////////////
  // INTERPRETATION

  // evaluate tooltip for allied kami Stop button
  const getAddTooltip = (kamis: Kami[]): string => {
    let text = getDisabledReason(kamis);
    if (text === '') text = 'Add Kami to Node';
    return text;
  };

  const getDisabledReason = (kamis: Kami[]): string => {
    let reason = '';
    let available = [...kamis];

    if (account.roomIndex !== node.roomIndex) {
      reason = 'node too far!';
    }

    if (available.length == 0) {
      reason = 'you have no kamis!';
    }

    available = available.filter((kami) => isResting(kami));
    if (available.length == 0 && reason === '') {
      reason = 'you have no resting kami!';
    }

    available = available.filter((kami) => !onCooldown(kami));
    if (available.length == 0 && reason === '') {
      reason = 'your kami are on cooldown!';
    }

    return reason;
  };

  /////////////////
  // RENDERING

  // button for adding Kami to node
  const AddButton = (kamis: Kami[]) => {
    const options = kamis.filter((kami) => canHarvest(kami));
    const actionOptions = options.map((kami) => {
      return { text: `${kami.name}`, onClick: () => props.addKami(kami) };
    });

    return (
      <Tooltip text={[getAddTooltip(kamis)]}>
        <IconListButton
          key={`harvest-add`}
          img={harvestIcon}
          options={actionOptions}
          disabled={options.length == 0 || account.roomIndex !== node.roomIndex}
        />
      </Tooltip>
    );
  };

  return (
    <Container key={node.name}>
      <Image src={NodeImages[node.index]} />
      <Content>
        <ContentTop>
          <TitleRow>
            <TitleText>{node.name}</TitleText>
            <AffinityText>{node.affinity}</AffinityText>
          </TitleRow>
          <DescriptionText>{node.description}</DescriptionText>
        </ContentTop>
        <ButtonRow>{AddButton(kamis)}</ButtonRow>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border-bottom: solid black 0.15vw;
  color: black;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-radius: 8px 0px 0px 0px;
  border-right: solid black 0.15vw;
  height: 11vw;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 1.4vw 0.7vw 0.7vw 0.7vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
`;

const ContentTop = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: flex-end;
`;

const TitleRow = styled.div`
  padding: 0.3vw 0vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
`;

const TitleText = styled.p`
  font-family: Pixel;
  font-size: 1.2vw;
`;

const AffinityText = styled.div`
  color: #777;
  padding-left: 0.5vw;
  flex-grow: 1;

  font-family: Pixel;
  font-size: 0.7vw;
`;

const DescriptionText = styled.p`
  font-size: 0.7vw;
  font-family: Pixel;
  line-height: 0.9vw;
  text-align: left;
  padding-top: 0.4vw;
  padding-left: 0.2vw;
`;
