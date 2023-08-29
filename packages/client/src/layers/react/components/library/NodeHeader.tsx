import React from 'react';
import styled from 'styled-components';

import { Node } from 'layers/react/shapes/Node';
import { NodeImages } from 'constants/nodes';

interface Props {
  node: Node;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const NodeHeader = (props: Props) => {
  console.log(props.node.index);

  const Content = () => {
    return (
      <ContentContainer>
        <TitleRow>
          <TitleText>{props.node.name}</TitleText>
          <AffinityText>{props.node.affinity}</AffinityText>
        </TitleRow>
        <DescriptionText>{props.node.description}</DescriptionText>
      </ContentContainer>
    );
  };

  return (
    <Container key={props.node.name}>
      <Image src={NodeImages[props.node.index]} />
      {Content()}
    </Container>
  );
};

const Container = styled.div`
  border-bottom: .15vw solid black;
  color: black;
  margin-bottom: .2vw;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-radius: 8px 0px 0px 0px;
  height: 10vw;
`;

const ContentContainer = styled.div`
  flex-grow: 1;
  padding: .7vw;

  display: flex;
  flex-flow: column nowrap;
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


