import React from 'react';
import styled from 'styled-components';

interface Props {
  image: string;
  content: React.ReactNode;
  imageOnClick?: () => void;
  titleBarContent?: React.ReactNode;
}

// Card is a card that displays a visually encapsulated image (left) and text-based content (right)
export const Card = (props: Props) => {

  // toggle the kami modal settings depending on current its current state
  const imageOnClick = () => {
    if (props.imageOnClick) {
      props.imageOnClick();
      return;
    }
  }

  return (
    <Container key={props.image}>
      <Image onClick={() => imageOnClick()} src={props.image} />
      <ContentContainer>
        {props.titleBarContent ? <TitleBar>{props.titleBarContent}</TitleBar> : null}
        <Content>{props.content}</Content>
      </ContentContainer>
    </Container>
  );
};

const Container = styled.div`
  background-color: #fff;
  border: .15vw solid black;
  border-radius: .35vw;
  color: black;
  margin: .15vw;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-style: solid;
  border-width: 0vw .15vw 0vw 0vw;
  border-color: black;
  border-radius: .15vw 0vw 0vw .15vw;
  height: 9vw;
  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
`;

const ContentContainer = styled.div`
  border-color: black;
  border-width: .15vw;
  color: black;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;

const TitleBar = styled.div`
  border-style: solid;
  border-width: 0vw 0vw .15vw 0vw;
  border-color: black;
  padding: .45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: .7vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
`;
