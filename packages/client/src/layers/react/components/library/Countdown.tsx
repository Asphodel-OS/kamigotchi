import React from "react";
import styled from "styled-components";

interface Props {
  total: number;
  current: number;
}

const CountdownWrapper = styled.div`
  position: relative;
  width: 1.1vw;
  height: 1.1vw;
`;

const CountdownCircle = styled.div<{ percent: number, color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    #aaa ${(props) => props.percent}%,
    #aaa ${(props) => props.percent}% ${(props) => props.percent}%,
    ${(props) => props.color} ${(props) => props.percent}%
  );
`;

const InnerCircle = styled.div`
  position: absolute;
  top: 20%;
  bottom: 20%;
  left: 20%;
  right: 20%;
  background: white;
  border-radius: 50%;
`;

// 0% means countdown is finished
export const Countdown: React.FC<Props> = ({ total, current }) => {
  const percent = (current / total) * 100;

  let color = '#29ABE9'; // blue;
  if (percent > 80) color = '#FF6611'; // red
  else if (percent > 50) color = '#FFD022'; // yellow
  else if (percent > 0) color = '#23BD41'; // green

  console.log('current', current);
  console.log('total', total);
  return (
    <CountdownWrapper>
      <CountdownCircle percent={percent} color={color} />
      <InnerCircle />
    </CountdownWrapper>
  );
};

export default Countdown;