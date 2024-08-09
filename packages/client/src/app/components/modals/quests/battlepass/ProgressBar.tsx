import { Tooltip } from 'app/components/library';
import styled from 'styled-components';

const DefaultColors = {
  background: '#bbb',
  foreground: '#1e1',
};

interface Props {
  total: number;
  current: number;
  height?: number;
  colors?: {
    background?: string;
    progress?: string;
  };
}

export const ProgressBar = (props: Props) => {
  const { total, current, height, colors } = props;
  const bgColor = colors?.background ?? DefaultColors.background;
  const fgColor = colors?.progress ?? DefaultColors.foreground;

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
          bgColor={bgColor}
          fgColor={fgColor}
        />
      </Tooltip>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.7vh 0.8vw;

  display: flex;
  flex-flow: column no-wrap;
  justify-content: space-between;
  align-items: center;
  width: 100%;
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
