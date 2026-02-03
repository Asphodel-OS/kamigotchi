import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { calcPercentCompletion } from 'utils/numbers';

export const ProgressBar = ({
  total,
  current,
  width,
  height = 1.2,
  colors: {
    background = '#fff',
    progress = '#000',
  } = {},
  icon,
}: {
  total: number;
  current: number;
  width?: number;
  height?: number;
  colors?: {
    background?: string;
    progress?: string;
  };
  icon?: string;
}) => {
  return (
    <Container width={width}>
      <TextTooltip text={[`${current}/${total}`]} grow>
        <Bar
          percent={calcPercentCompletion(current, total)}
          height={height}
          bgColor={background}
          fgColor={progress}
        >
          {icon && <Icon src={icon} alt='icon' position={calcPercentCompletion(current, total)} />}
        </Bar>
      </TextTooltip>
    </Container>
  );
};

const Container = styled.div<{ width?: number }>`
  width: ${({ width }) => (width ? `${width}em;` : '100%')};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Icon = styled.img<{ position: number }>`
  left: ${({ position }) => `calc(${position}% - 10px)`};
  position: absolute;
  height: 1.8em;
  width: auto;
  border: solid black 0.15em;
  background-color: white;
  border-radius: 50%;
`;

const Bar = styled.div<{
  height: number;
  percent: number;
  bgColor: string;
  fgColor: string;
}>`
  position: relative;
  border: solid black 0.15em;
  border-radius: ${({ height }) => height * 0.5}em;
  height: ${({ height }) => height}em;
  width: 100%;

  background: ${({ percent, bgColor, fgColor }) =>
    `linear-gradient(90deg, ${fgColor}, 0%, ${fgColor}, ${percent}%, ${bgColor}, ${percent}%, ${bgColor} 100%)`};

  display: flex;
  align-items: center;
`;
