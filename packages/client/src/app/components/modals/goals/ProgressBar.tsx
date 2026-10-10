import styled from 'styled-components';

import { Palette } from 'app/components/library/pastel';

export const ProgressBar = ({ max, current }: { max: number; current: number }) => {
  const ratio = max > 0 ? Math.min(Number(current) / Number(max), 1) : 0;
  const percent = `${(ratio * 100).toFixed(1)}%`;

  return (
    <Track>
      <Fill style={{ width: percent }} />
      <Percent>{percent}</Percent>
    </Track>
  );
};

const Track = styled.div`
  position: relative;
  width: 100%;
  height: 1.5vw;
  overflow: hidden;

  background: ${Palette.progress.track};
  border: solid ${Palette.ink} 0.15vw;
  border-radius: 99vw;
`;

const Fill = styled.div`
  height: 100%;
  background: ${Palette.progress.fill};
  border-right: solid ${Palette.progress.edge} 0.1vw;
  transition: width 0.4s ease;
`;

const Percent = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  font-family: Pixel;
  font-size: 0.62vw;
  color: ${Palette.ink};
`;
