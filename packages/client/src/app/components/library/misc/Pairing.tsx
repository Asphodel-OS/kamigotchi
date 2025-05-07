import styled from 'styled-components';

import { Tooltip } from '../poppers/Tooltip';
import { Text } from '../text';

const SCALE_DEFAULT = 1.2;

interface Props {
  icon: string;
  text: string;
  tooltip?: string[];
  scale?: number;
  reverse?: boolean;
}

// horizontal icon and text pairing
export const Pairing = (props: Props) => {
  const { icon, text, tooltip, scale, reverse } = props;
  const size = scale ?? SCALE_DEFAULT;

  return (
    <Container scale={size}>
      {reverse && <Text size={size}>{text}</Text>}
      <Tooltip text={tooltip ?? []}>
        <Icon src={icon} scale={size} />
      </Tooltip>
      {!reverse && <Text size={size}>{text}</Text>}
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
  ${({ scale }) => (scale > 2 ? 'image-rendering: pixelated;' : '')}
`;
