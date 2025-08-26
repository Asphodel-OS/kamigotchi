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
  reverse = false,
}: {
  icon: string;
  text: string;
  tooltip?: string[];
  scale?: number;
  reverse?: boolean;
}) => {
  return (
    <Container scale={scale}>
      {reverse && <Text size={scale}>{text}</Text>}
      <TextTooltip text={tooltip}>
        <Icon src={icon} scale={scale} />
      </TextTooltip>
      {!reverse && <Text size={scale}>{text}</Text>}
    </Container>
  );
};

const Container = styled.div<{ scale: number }>`
  gap: ${({ scale }) => scale * 0.5}vw;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  user-select: none;
`;

const Icon = styled.img<{ scale: number }>`
  height: ${({ scale }) => scale * 1.5}vw;
  margin-bottom: ${({ scale }) => scale * 0.12}vw;
  ${({ scale }) => (scale > 2 ? 'image-rendering: pixelated;' : '')}
`;
