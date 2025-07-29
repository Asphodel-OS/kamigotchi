import React from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { LevelUpArrows } from '../animations/LevelUp';
import { TextTooltip } from '../poppers/TextTooltip';
import { Overlay } from '../styles';

// Card is a card that displays a visually encapsulated image (left) and text-based content (right)
export const Card = ({
  children,
  image: {
    icon,
    onClick,
    overlay,
    canLevel,
    padding = 0,
    scale = 9,
    tooltip = [],
  } = {},
  fullWidth,
}: {
  children: React.ReactNode;
  image?: {
    icon?: string;
    onClick?: () => void;
    overlay?: string;
    canLevel?: boolean;
    padding?: number;
    scale?: number;
    tooltip?: string[];
  };
  fullWidth?: boolean;
}) => {
  // handle image click if there is one
  const handleImageClick = () => {
    if (onClick) {
      onClick();
      playClick();
    }
  };

  return (
    <Wrapper fullWidth={fullWidth}>
      <TextTooltip text={tooltip}>
        <ImageContainer scale={scale} padding={padding}>
          <Overlay bottom={scale * 0.075} right={scale * 0.06}>
            <Text size={scale * 0.075}>{overlay}</Text>
          </Overlay>
          {!!canLevel && <LevelUpArrows />}
          <Image src={icon} onClick={handleImageClick} />
        </ImageContainer>
      </TextTooltip>
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

const ImageContainer = styled.div<{ scale: number; padding: number }>`
  position: relative;
  border-right: solid black 0.15vw;
  border-radius: 0.45vw 0vw 0vw 0.45vw;
  height: ${({ scale }) => scale}vw;
  width: ${({ scale }) => scale}vw;
  padding: ${({ padding }) => padding}vw;
  ${({ scale }) => scale > 4 && `image-rendering: pixelated;`}
  user-select: none;
  overflow: hidden;
`;

const Image = styled.img<{ onClick?: () => void }>`
  object-fit: cover;
  height: 100%;
  width: 100%;

  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'auto')};
  &:hover {
    opacity: 0.75;
  }
  user-drag: none;
  -webkit-user-drag: none;
  -moz-user-select: none;
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

const Text = styled.div<{ size: number }>`
  color: black;
  font-size: ${({ size }) => size}vw;
`;
