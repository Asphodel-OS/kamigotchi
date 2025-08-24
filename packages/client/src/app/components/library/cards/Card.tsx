import React from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { LevelUpArrows } from '../animations/LevelUp';
import { TextTooltip } from '../poppers/TextTooltip';
import { Overlay } from '../styles';

interface Props {
  children: React.ReactNode;
  image?: {
    icon?: string;
    onClick?: () => void;
    overlay?: string;
    padding?: number;
    scale?: number;
    showLevelUp?: boolean;
    showSkillPoints?: boolean;
    tooltip?: string[];
    skillPoints?: boolean;
    background?: React.ReactNode;
    foreground?: React.ReactNode; // rendered above image
    filter?: string; // CSS filter applied to base image only
  };
  fullWidth?: boolean;
}

// Card is a card that displays a visually encapsulated image (left) and text-based content (right)
export const Card = (props: Props) => {
  const { image, children, fullWidth } = props;
  const scale = image?.scale ?? 9;

  // handle image click if there is one
  const handleImageClick = () => {
    if (image?.onClick) {
      image.onClick();
      playClick();
    }
  };

  return (
    <Wrapper fullWidth={fullWidth}>
      <TextTooltip text={image?.tooltip ?? []}>
        <ImageContainer scale={scale} padding={image?.padding}>
          {!!image?.background && <BackgroundSlot>{image.background}</BackgroundSlot>}
          <Overlay bottom={scale * 0.075} right={scale * 0.06}>
            <Text size={scale * 0.075}>{image?.overlay}</Text>
          </Overlay>
          {!!image?.showLevelUp && <LevelUpArrows />}
          <Overlay top={0.5} right={0.5}>
            {!!image?.showSkillPoints && <Sp>SP</Sp>}
          </Overlay>
          <Image src={image?.icon} onClick={handleImageClick} style={{ filter: image?.filter }} />
          {!!image?.foreground && <ForegroundSlot>{image.foreground}</ForegroundSlot>}
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

const ImageContainer = styled.div<{ scale: number; padding?: number }>`
  position: relative;
  border-right: solid black 0.15vw;
  border-radius: 0.45vw 0vw 0vw 0.45vw;
  min-height: 100%;
  height: ${({ scale }) => scale}vw;
  width: ${({ scale }) => scale}vw;
  padding: ${({ padding }) => padding ?? 0}vw;
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

const BackgroundSlot = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const ForegroundSlot = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const Text = styled.div<{ size: number }>`
  color: black;
  font-size: ${(props) => props.size}vw;
`;

const Sp = styled.div`
  font-size: 1.2vw;
  font-weight: bold;
  background: linear-gradient(to right, #0b0d0eff, #ee0979);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
