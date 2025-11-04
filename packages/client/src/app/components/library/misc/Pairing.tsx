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
  tooltip?: string[];
  scale?: number;
  textSize?: number;
  iconSize?: number;
  reverse?: boolean;
  background?: {
    gradient: string;
  };
}) => {
  return (
    <Container gap={textSize ?? scale} color={background?.gradient ?? '#fff'}>
      {reverse && <Text size={textSize ?? scale}>{text}</Text>}
      <TextTooltip text={tooltip}>
        <Icon src={icon} scale={iconSize ?? scale} color={background?.gradient ?? '#fff'} />
      </TextTooltip>
      {!reverse && <Text size={textSize ?? scale}>{text}</Text>}
    </Container>
  );
};

const Container = styled.div<{ gap: number; color: string }>`
  gap: ${({ gap }) => gap * 0.3}vw;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  user-select: none;
  pointer-events: auto;

  // background: radial-gradient(ellipse at center, ${({ color }) => color} 0%, transparent 80%);
  border-bottom: solid ${({ color }) => color} 0.15vw;
`;

const Icon = styled.img<{ scale: number; color: string }>`
  height: ${({ scale }) => scale * 1.5}vw;
  margin-bottom: ${({ scale }) => scale * 0.12}vw;
  ${({ scale }) => (scale > 2 ? 'image-rendering: pixelated;' : '')}
  user-drag: none;
`;
