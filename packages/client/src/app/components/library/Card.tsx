import React from 'react';
import styled from 'styled-components';

interface Props {
  image?: string;
  content: React.ReactNode;
  imageOnClick?: () => void;
  titleBarContent?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Card is a card that displays a visually encapsulated image (left) and text-based content (right)
export const Card = (props: Props) => {
  // toggle the kami modal settings depending on current its current state
  const imageOnClick = () => {
    if (props.imageOnClick) {
      props.imageOnClick();
      return;
    }
  };

  return (
    <Wrapper key={props.image} fullWidth={props.fullWidth}>
      <Image onClick={() => imageOnClick()} src={props.image} size={props.size} />
      <Container>
        {props.titleBarContent ? <TitleBar>{props.titleBarContent}</TitleBar> : null}
        <Content>{props.content}</Content>
      </Container>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ fullWidth?: boolean }>`
  background-color: #fff;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  color: black;
  margin: 0.15vw;

  display: flex;
  flex-flow: row nowrap;

  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;

const Image = styled.img<{ size?: 'small' | 'medium' | 'large' }>`
  border-style: solid;
  border-width: 0vw 0.15vw 0vw 0vw;
  border-color: black;
  border-radius: 0.45vw 0vw 0vw 0.45vw;
  object-fit: cover;
  object-position: 100% 0;

  cursor: pointer;
  &:hover {
    opacity: 0.75;
  }

  height: ${(props) => {
    if (props.size === 'small') return '6vw';
    if (props.size === 'large') return '12vw';
    return '9vw';
  }};

  width: ${(props) => {
    if (props.size === 'small') return '6vw';
    if (props.size === 'large') return '12vw';
    return '9vw';
  }};
`;

const Container = styled.div`
  border-color: black;
  border-width: 0.15vw;
  color: black;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;

const TitleBar = styled.div`
  border-style: solid;
  border-width: 0vw 0vw 0.15vw 0vw;
  border-color: black;
  padding: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 0.2vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
`;
