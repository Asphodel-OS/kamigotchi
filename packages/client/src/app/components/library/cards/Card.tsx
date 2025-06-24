import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { animate, createScope, createSpring, Scope } from 'animejs';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
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
    tooltip?: string[];
  };
  fullWidth?: boolean;
}

// Card is a card that displays a visually encapsulated image (left) and text-based content (right)
export const Card = (props: Props) => {
  const { image, children, fullWidth } = props;
  const scale = image?.scale ?? 9;
  const scope = useRef<Scope | null>(null);
  const ArrowRefs = new Array(7).fill(null).map(() => useRef<SVGSVGElement>(null));

  useEffect(() => {
    scope.current = createScope().add(() => {
      ArrowRefs.forEach((ref, index) => {
        if (ref.current) {
          animate(ref.current, {
            translateX: [
              { to: '-30%', duration: 50, easing: 'easeInOutSine' },
              { to: '30%', duration: 50, easing: 'easeInOutSine' },
              { to: '-30%', duration: 50, easing: 'easeInOutSine' },
            ],
            translateY: ['150%', '-500%'],
            scale: [
              { to: 1.25, ease: 'inOut(3)', duration: 200 },
              { to: 1, ease: createSpring({ stiffness: 300 }) },
            ],
            loop: true,
            delay: 250 * (index + 0.01),
            loopDelay: 250 * (index + 0.01),
            direction: 'alternate',
            duration: 1000,
          });
        }
      });
    });

    return () => scope.current?.revert();
  }, []);

  // handle image click if there is one
  const handleImageClick = () => {
    if (image?.onClick) {
      image.onClick();
      playClick();
    }
  };
  const Arrows = () => {
    const positions = [70, 7, 60, 20, 10, 30, 50];
    return ArrowRefs.map((ref, i) => {
      return (
        <ArrowUpwardIcon
          key={`arrow-${i}`}
          style={{
            position: 'absolute',
            left: positions[i] + `%`,
            bottom: `10%`,
            width: '20%',
            height: '20%',
          }}
          ref={ref}
        />
      );
    });
  };

  return (
    <Wrapper fullWidth={fullWidth}>
      <TextTooltip text={image?.tooltip ?? []}>
        <ImageContainer scale={scale} padding={image?.padding}>
          <Overlay bottom={scale * 0.075} right={scale * 0.06}>
            <Text size={scale * 0.075}>{image?.overlay}</Text>
          </Overlay>
          {Arrows()}
          <Image src={image?.icon} onClick={handleImageClick} />
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

const Text = styled.div<{ size: number }>`
  color: black;
  font-size: ${(props) => props.size}vw;
`;
