import React from 'react';
import styled from 'styled-components';
import { playClick } from 'utils/sounds';

interface Props {
  image?: string;
  children: React.ReactNode;
  imageOnClick?: () => void;
  fullWidth?: boolean;
  scale?: number;
}

// Card is a card that displays a visually encapsulated image (left) and text-based content (right)
export const Card = (props: Props) => {
  const { image, children, imageOnClick, fullWidth } = props;
  const scale = props.scale ?? 9;

  // handle image click if there is one
  const handleImageClick = () => {
    if (imageOnClick) {
      imageOnClick();
      playClick();
    }
  };

  return (
    <Wrapper fullWidth={fullWidth}>
      <Image onClick={() => handleImageClick()} src={image} scale={scale} />
      <Container>{children}</Container>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ fullWidth?: boolean }>`
  background-color: #fff;
  border: 0.15vw solid black;
  border-radius: 0.6vw;

  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img<{ scale: number }>`
  border-right: solid black 0.15vw;
  border-radius: 0.45vw 0vw 0vw 0.45vw;
  object-fit: cover;

  height: ${({ scale }) => scale}vw;
  width: ${({ scale }) => scale}vw;

  cursor: pointer;
  &:hover {
    opacity: 0.75;
  }
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
