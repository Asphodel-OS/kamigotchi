import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { NodeImages } from 'constants/nodes';
import { ActionListButton } from 'layers/react/components/library/ActionListButton';
import { Node } from 'layers/react/shapes/Node';
import { Kami } from 'layers/react/shapes/Kami';
import { Tooltip } from '../../library/Tooltip';


interface Props {
  node: Node;
  kamis: Kami[];
  addKami: (kami: Kami) => void;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const Banner = (props: Props) => {
  const [lastRefresh, setLastRefresh] = useState(Date.now());


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

  // calculate the time a kami has spent idle (in seconds)
  const calcIdleTime = (kami: Kami): number => {
    return lastRefresh / 1000 - kami.lastUpdated;
  };

  const getRestingKamis = (kamis: Kami[]): Kami[] => {
    return kamis.filter((kami) => kami.state === 'RESTING');
  }

  const getKamisOffCooldown = (kamis: Kami[]): Kami[] => {
    return kamis.filter((kami) => calcIdleTime(kami) >= kami.cooldown);
  };


  /////////////////
  // RENDERING

  // button for adding Kami to node
  const AddButton = (kamis: Kami[]) => {
    let reason = '';

    let validKamis = getRestingKamis(kamis);
    if (validKamis.length == 0) {
      reason = 'you have no resting kami';
    }

    validKamis = getKamisOffCooldown(kamis)
    if (validKamis.length == 0 && reason == '') {
      reason = 'your kami are on cooldown';
    }


    const options = validKamis.map((kami) => {
      return { text: `${kami.name}`, onClick: () => props.addKami(kami) };
    });

    return (
      <Tooltip text={[reason]}>
        <ActionListButton
          id={`harvest-add`}
          key={`harvest-add`}
          text='Add Kami'
          options={options}
          disabled={validKamis.length == 0}
        />
      </Tooltip>
    );
  };

  return (
    <Container key={props.node.name}>
      <Image src={NodeImages[props.node.index]} />
      <Content>
        <ContentTop>
          <TitleRow>
            <TitleText>{props.node.name}</TitleText>
            <AffinityText>{props.node.affinity}</AffinityText>
          </TitleRow>
          <DescriptionText>{props.node.description}</DescriptionText>
        </ContentTop>
        <ButtonRow>{AddButton(props.kamis)}</ButtonRow>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border-bottom: solid black .15vw;
  color: black;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-radius: 8px 0px 0px 0px;
  border-right: solid black .15vw;
  height: 10vw;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 1.4vw .7vw .7vw .7vw;

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
  padding: .3vw 0vw;

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
  padding-left: .5vw;
  flex-grow: 1;

  font-family: Pixel;
  font-size: 0.7vw;
`;

const DescriptionText = styled.p`
  font-size: 0.7vw;
  font-family: Pixel;
  line-height: .9vw;
  text-align: left;
  padding-top: .4vw;
  padding-left: .2vw;
`;


