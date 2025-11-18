import styled from 'styled-components';

import { TextTooltip } from '../poppers/TextTooltip';
import { Text } from '../text';

const SCALE_DEFAULT = 1.2;

// horizontal icon and text pairing
export const Pairing = ({
  icon,
  text,
  tooltip = [],
  scale = SCALE_DEFAULT,
  iconSize,
  textSize,
  background,
  reverse = false,
}: {
  icon: string;
  text: string;
  textSize?: number;
  iconSize?: number;
  background?: {
    gradient: string;
    border: string;
  };
  reverse?: boolean;
  scale?: number; // default scale if iconSize and textSize aren't defined
  tooltip?: string[];
}) => {
  return (
    <Container
      gap={textSize ?? scale}
      color={background?.gradient ?? '#fff'}
      border={background?.border ?? '#fff'}
    >
      {reverse && (
        <Text color={background?.border ?? '#000000ff'} size={textSize ?? scale}>
          {text}
        </Text>
      )}
      <TextTooltip text={tooltip}>
        <Icon src={icon} scale={iconSize ?? scale} color={background?.gradient ?? '#fff'} />
      </TextTooltip>
      {!reverse && (
        <Text color={background?.border ?? '#000000ff'} size={textSize ?? scale}>
          {text}
        </Text>
      )}
    </Container>
  );
};

const Container = styled.div<{ gap: number; color: string; border: string }>`
  gap: ${({ gap }) => gap * 0.3}vw;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  user-select: none;
  pointer-events: auto;

  background: ${({ color }) => color};
  padding: 0.15vw;
  border: solid ${({ border }) => border} 0.15vw;
  border-radius: 0.3vw;
`;

const Icon = styled.img<{ scale: number }>`
  height: ${({ scale }) => scale * 1.5}vw;
  margin-bottom: ${({ scale }) => scale * 0.12}vw;
  ${({ scale }) => (scale > 2 ? 'image-rendering: pixelated;' : '')}
  user-drag: none;
`;
