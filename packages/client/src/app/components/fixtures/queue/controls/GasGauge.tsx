import styled from 'styled-components';

import { useVisibility } from 'app/stores';
import { clickFx, hoverFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

export const GasGauge = ({
  level,
}: {
  level: number; // [0, 1]
}) => {
  const setModals = useVisibility((s) => s.setModals);
  const operatorFundVisible = useVisibility((s) => s.modals.operatorFund);

  const handleClick = () => {
    playClick();
    setModals({ operatorFund: !operatorFundVisible });
  };

  const levelToAngle = (level: number) => {
    const bounded = Math.max(0, Math.min(1, level)); // bound between 0 and 1 if not
    const angle = bounded * 180 - 90; // scale to [0, 180] and shift to [-90, 90]
    return angle;
  };

  return (
    <Container onClick={handleClick} effectScale={0.15}>
      <Meter>
        <Arrow angle={levelToAngle(level)}>
          <Tip />
          <Arm />
        </Arrow>
        <Pivot />
      </Meter>
    </Container>
  );
};

const Container = styled.div<{ effectScale: number }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    animation: ${({ effectScale }) => hoverFx(effectScale)} 0.2s;
    transform: scale(${({ effectScale }) => 1 + effectScale});
  }
  &:active {
    animation: ${({ effectScale }) => clickFx(effectScale)} 0.3s;
  }
`;

const Meter = styled.div`
  position: relative;
  border: 0.15rem solid #333;
  border-radius: 1.2rem 1.2rem 0.3rem 0.3rem;
  width: 2.4rem;
  height: 1.5rem;
  background: conic-gradient(from 180deg at 50% 100%, red, red, orange, yellow, green, green);
`;

const Arrow = styled.div<{ angle: number }>`
  position: absolute;
  bottom: -0.07rem;
  left: 50%;

  height: 75%;
  transform: translateX(-50%) rotate(${({ angle }) => angle}deg);
  transform-origin: bottom center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Arm = styled.div`
  position: relative;
  background-color: #333;
  width: 0.15rem;
  height: 100%;
`;

const Tip = styled.div`
  position: absolute;
  border: solid #333 0.12rem;
  bottom: 80%;
  right: 50%;

  transform: rotate(45deg);
  transform-origin: bottom right;
`;

const Pivot = styled.div`
  position: absolute;
  background-color: #333;
  border-radius: 0.15rem;
  width: 0.3rem;
  height: 0.3rem;
  bottom: -17%;
  right: 50%;
  transform-origin: bottom center;
  transform: translateX(50%);
`;
