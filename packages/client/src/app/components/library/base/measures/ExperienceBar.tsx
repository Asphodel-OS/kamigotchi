import styled from 'styled-components';
import { Tooltip } from '../Tooltip';

export const MockupBar = () => {
  const mockupProgress = () => {
    let currentProgress = 0;
    return currentProgress;
  };

  return (
    <BarAndLevel>
      <Level style={{ fontSize: '0.6vw' }}>Lvl 1</Level>
      <Tooltip text={['0/40']}>
        <Bar>
          <Progress width={mockupProgress()} />
        </Bar>
      </Tooltip>
    </BarAndLevel>
  );
};

const BarAndLevel = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  --width: 12.5vw;
  position: relative;
  right: 6%;
`;

const Level = styled.div`
  width: 2.8vw;
  height: 2vw;
  border: 0.15vw solid #c2c0bf;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  --r: 1.5vw;
  margin: calc(tan(22.5deg) * var(--r));
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%) margin-box;
  --_g: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_s: calc(100% - (1 - tan(22.5deg)) * var(--r));
  background: #88a65e;
  color: white;
  text-shadow:
    -0.08vw -0.08vw 0 #434a46,
    0.08vw -0.08vw 0 #434a46,
    -0.08vw 0.08vw 0 #434a46,
    0.08vw 0.08vw 0 #434a46;
`;

const Bar = styled.div`
  width: var(--width);
  background-color: #f0f0f0;
  border: 0.15vw solid #c2c0bf;
  height: 1vw;
  padding: 0.1vw;
  border-radius: 0.3vw;
  margin-left: -0.4vw;
`;

const Progress = styled.div<{ width: number }>`
  width: ${({ width }) => width}%;
  height: 100%;
  border-radius: 3vw;
  transition: width 0.3s ease;
  background: repeating-linear-gradient(
    125deg,
    #98cd8d 0.01vw,
    #f6f0cf 0.01vw,
    #f6f0cf 0.05vw,
    #98cd8d 0.05vw,
    #98cd8d 0.2vw,
    #f6f0cf 0.2vw,
    #f6f0cf 0.3vw
  );
`;
