import React from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { LevelUpArrows } from '../animations/LevelUp';
import { Overlay } from '../styles';
import { TextTooltip } from '../tooltips';

// Card is a card that displays a visually encapsulated image (left) and text-based content (right)
export const Card = ({
  image,
  children,
  fullWidth,
}: {
  children: React.ReactNode;
  image?: {
    icon?: string;
    onClick?: () => void;
    fit?: 'cover' | 'contain';
    padding?: number;
    scale?: number;
    tooltip?: {
      text: string[] | React.ReactNode[];
      width?: { desktop?: number; mobile?: number };
    };
    effects?: {
      overlay?: string;
      showLevelUp?: boolean; // TODO: move this field up one level to KamiCard, pass in as Foreground
      showSkillPoints?: boolean; // TODO: move this field up one level to KamiCard, pass in as Foreground or Overlay
      background?: React.ReactNode;
      foreground?: React.ReactNode; // rendered above image
      filter?: string; // CSS filter applied to base image only
    };
  };
  fullWidth?: boolean;
}) => {
  const scale = image?.scale ?? 9;
  const effects = image?.effects;

  // handle image click if there is one
  const handleImageClick = () => {
    if (image?.onClick) {
      image.onClick();
      playClick();
    }
  };

  return (
    <Wrapper fullWidth={fullWidth}>
      <TextTooltip
        text={image?.tooltip?.text ?? []}
        width={{
          desktop: image?.tooltip?.width?.desktop,
          mobile: image?.tooltip?.width?.mobile,
        }}
      >
        <ImageContainer scale={scale} padding={image?.padding}>
          {!!effects?.background && <BackgroundSlot>{effects.background}</BackgroundSlot>}
          <Overlay bottom={scale * 0.075} right={scale * 0.06}>
            <Text size={scale * 0.075}>{effects?.overlay}</Text>
          </Overlay>
          {!!effects?.showLevelUp && <LevelUpArrows />}
          <Overlay top={0.5} right={0.5}>
            {!!effects?.showSkillPoints && <Sp>SP</Sp>}
          </Overlay>
          <Image
            src={image?.icon}
            onClick={handleImageClick}
            style={{ filter: effects?.filter }}
            fit={image?.fit}
          />
          {!!effects?.foreground && <ForegroundSlot>{effects.foreground}</ForegroundSlot>}
        </ImageContainer>
      </TextTooltip>
      <Container>{children}</Container>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ fullWidth?: boolean }>`
  background-color: #fff;
  border: 0.15em solid black;
  border-radius: 0.6em;

  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};

  display: flex;
  flex-flow: row nowrap;
`;

const ImageContainer = styled.div<{ scale: number; padding?: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-right: solid black 0.15em;
  border-radius: 0.45em 0em 0em 0.45em;
  min-height: 100%;
  height: ${({ scale }) => scale}em;
  width: ${({ scale }) => scale}em;

  padding: ${({ padding }) => padding ?? 0}em;
  ${({ scale }) => scale > 4 && `image-rendering: pixelated;`}
  user-select: none;
  overflow: hidden;
`;

const Image = styled.img<{ onClick?: () => void; fit?: string }>`
  object-fit: ${({ fit }) => fit ?? 'cover'};
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
  border-width: 0.15em;
  color: black;
  flex-grow: 1;
  min-width: 0;
  overflow: hidden;

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
  font-size: ${(props) => props.size}em;
`;

const Sp = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  background: linear-gradient(to right, #0b0d0eff, #ee0979);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
