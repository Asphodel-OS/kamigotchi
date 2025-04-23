import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { calcPercentCompletion } from 'utils/numbers';

interface Props {
  total: number;
  current: number;
  width?: number;
  height?: number;
  colors?: {
    background?: string;
    progress?: string;
  };
}

export const ProgressBar = (props: Props) => {
  const { total, current, height, colors } = props;

  const getBgColor = () => {
    return colors?.background ?? '#fff';
  };

  const getFgColor = () => {
    return colors?.progress ?? '#000';
  };

  return (
    <Container width={props.width}>
      <Tooltip text={[`${current}/${total}`]} grow>
        <Bar
          percent={calcPercentCompletion(current, total)}
          height={height ?? 1.2}
          bgColor={getBgColor()}
          fgColor={getFgColor()}
        />
      </Tooltip>
    </Container>
  );
};

const Container = styled.div<{ width?: number }>`
  width: ${({ width }) => (width ? `${width}vw;` : '100%')};
  opacity: 0.9;

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface BarProps {
  height: number;
  percent: number;
  bgColor: string;
  fgColor: string;
}

const Bar = styled.div<BarProps>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: ${({ height }) => height * 0.5}vw;
  height: ${({ height }) => height}vw;
  width: 100%;

  background: ${({ percent, bgColor, fgColor }) =>
    `linear-gradient(90deg, ${fgColor}, 0%, ${fgColor}, ${percent}%, ${bgColor}, ${percent}%, ${bgColor} 100%)`};

  display: flex;
  align-items: center;
`;
