import styled from 'styled-components';

import { Tooltip } from './Tooltip';

const SCALE_DEFAULT = 1.2;

interface Props {
  icon: string;
  text: string;
  tooltip?: string[];
  scale?: number;
  reverse?: boolean;
}

export const Pairing = (props: Props) => {
  const { icon, text, tooltip, scale, reverse } = props;
  const size = scale ?? SCALE_DEFAULT;

  return (
    <Container scale={size}>
      {reverse && <Text scale={size}>{text}</Text>}
      <Tooltip text={tooltip ?? []}>
        <Icon src={icon} scale={size} />
      </Tooltip>
      {!reverse && <Text scale={size}>{text}</Text>}
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

const Text = styled.div<{ scale: number }>`
  height: ${({ scale }) => scale}vw;
  margin-top: 0.6vw;
  font-size: 1vw;
  color: #333;
`;
