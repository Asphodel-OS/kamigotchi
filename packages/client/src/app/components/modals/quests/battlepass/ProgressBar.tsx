import styled from 'styled-components';

import { Tooltip } from 'app/components/library';

interface Props {
  total: number;
  current: number;
  height?: number;
  colors: {
    background: string;
    progress: string;
  };
}

export const ProgressBar = (props: Props) => {
  const { total, current, height, colors } = props;

  const getPercent = (curr: number, tot: number) => {
    if (total === 0) return 0;
    if (curr > total) return 100;
    const truncated = Math.round((curr / tot) * 1000) / 10;
    return Math.min(100, truncated);
  };

  return (
    <Container>
      <Tooltip text={[`${current}/${total}`]} grow>
        <Bar
          percent={getPercent(current, total)}
          height={height ?? 1.2}
          bgColor={colors.background}
          fgColor={colors.progress}
        />
      </Tooltip>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
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
