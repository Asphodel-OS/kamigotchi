import styled from 'styled-components';

import { useVisibility } from 'layers/react/store';
import { playClick } from 'utils/sounds';

type GaugeProps = {
  level: number;
};

const getColor = (level: number) => {
  if (level <= 20) return '#FF6600';
  if (level <= 50) return '#FFD000';
  return '#23AD41';
};

export const GasGauge = (props: GaugeProps) => {
  const { modals, setModals } = useVisibility();

  const handleClick = () => {
    playClick();
    setModals({ ...modals, operatorFund: !modals.operatorFund });
  };

  const arrowStyles = {
    backgroundColor: getColor(props.level),
    transform: `rotate(${props.level * 1.6 - 80}deg)`,
  };

  return (
    <Container onClick={handleClick}>
      <GaugeOutline />
      <GaugeArrow style={arrowStyles} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.4vw;
  cursor: pointer;
`;

const GaugeOutline = styled.div`
  border-radius: 1vw 1vw 0 0;
  border: 0.125vw solid #444;
  border-bottom: 0;

  width: 1.75vw;
  height: 0.875vw;

  display: flex;
`;

const GaugeArrow = styled.div`
  position: absolute;
  border: 0.05vw solid #444;
  height: 0.5vw;
  transform-origin: bottom center;
`;
