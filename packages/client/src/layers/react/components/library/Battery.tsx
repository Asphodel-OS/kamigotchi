import React from 'react';
import styled from 'styled-components';

interface BatteryProps {
  percentage: number;
}

const BatteryContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
`;

const BatteryBar = styled.div<{ percentage: number }>`
  display: flex;
  width: 60px;
  height: 25px;
  border: 1px solid black;
  border-radius: 5px;
  position: relative;

  &::before {
    content: '';
    display: block;
    position: absolute;
    left: 1px;
    top: 1px;
    bottom: 1px;
    width: ${(props) => props.percentage}%;
    background-color: ${(props) => (props.percentage < 40 ? 'red' : 'green')};
    border-radius: 5px;
  }
`;

const BatteryText = styled.div``;

const Battery: React.FC<BatteryProps> = ({ percentage }) => {
  return (
    <BatteryContainer>
      <span>{percentage} %</span>
      <BatteryBar percentage={percentage}>
        <BatteryText />
      </BatteryBar>
    </BatteryContainer>
  );
};

export default Battery;
