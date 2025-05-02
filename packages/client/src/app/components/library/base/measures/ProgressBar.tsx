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
  icon?: string;
}

export const ProgressBar = (props: Props) => {
  const { total, current, height, colors, icon } = props;

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
        >
          {icon && <Icon src={icon} alt='icon' position={calcPercentCompletion(current, total)} />}
        </Bar>
      </Tooltip>
    </Container>
  );
};

const Container = styled.div<{ width?: number }>`
  width: ${({ width }) => (width ? `${width}vw;` : '100%')};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Icon = styled.img<{ position: number }>`
  left: ${({ position }) => `calc(${position}% - 10px)`};
  position: absolute;
  height: 1.8vw;
  width: auto;
  border: solid black 0.15vw;
  background-color: white;
  border-radius: 50%;
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
