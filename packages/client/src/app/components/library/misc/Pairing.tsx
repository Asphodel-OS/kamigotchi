import styled from 'styled-components';

import { Tooltip } from '../poppers/Tooltip';

const SCALE_DEFAULT = 1.2;

interface Props {
  icon: string;
  text: string;
  tooltip?: string[];
  scale?: number;
  reverse?: boolean;
  marginTop?: number;
}

// horizontal icon and text pairing
export const Pairing = (props: Props) => {
  const { icon, text, tooltip, scale, reverse, marginTop } = props;
  const size = scale ?? SCALE_DEFAULT;
  const margin = marginTop ?? 0.6;

  return (
    <Container scale={size}>
      {reverse && (
        <Text scale={size} margin={margin}>
          {text}
        </Text>
      )}
      <Tooltip text={tooltip ?? []}>
        <Icon src={icon} scale={size} />
      </Tooltip>
      {!reverse && (
        <Text scale={size} margin={margin}>
          {text}
        </Text>
      )}
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

const Text = styled.div<{ scale: number; margin: number }>`
  height: ${({ scale }) => scale}vw;
  margin-top: ${({ margin }) => margin}vw;
  font-size: 1vw;
  color: #333;
`;
