import React from 'react';
import styled from 'styled-components';

import { NodeImages } from 'constants/nodes';
import { ActionListButton } from 'layers/react/components/library/ActionListButton';
import { Node } from 'layers/react/shapes/Node';
import { Kami } from 'layers/react/shapes/Kami';


interface Props {
  node: Node;
  availableKamis: Kami[];
  addKami: (kami: Kami) => void;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const Banner = (props: Props) => {

  // button for adding Kami to node
  const AddButton = (kamis: Kami[]) => {
    const options = kamis.map((kami) => {
      return { text: `${kami.name}`, onClick: () => props.addKami(kami) };
    });

    return (
      <ActionListButton
        id={`harvest-add`}
        key={`harvest-add`}
        text='Add Kami'
        options={options}
        disabled={kamis.length == 0}
      />
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
        <ButtonRow>{AddButton(props.availableKamis)}</ButtonRow>
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


