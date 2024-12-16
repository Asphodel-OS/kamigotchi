import styled from 'styled-components';

interface Props {
  total: number;
  current: number;
}

// 0% means countdown is finished
export const Countdown = (props: Props) => {
  const { total, current } = props;
  const percent = (current / total) * 100;

  let color = '#29ABE9'; // blue;
  if (percent > 80)
    color = '#FF6611'; // red
  else if (percent > 50)
    color = '#FFD022'; // yellow
  else if (percent > 0) color = '#23BD41'; // green

  return (
    <CountdownWrapper>
      <CountdownCircle percent={percent} color={color} />
      <InnerCircle />
    </CountdownWrapper>
  );
};

const CountdownWrapper = styled.div`
  position: relative;
  width: 1.1vw;
  height: 1.1vw;
`;

interface CountdownCircleProps {
  percent: number;
  color: string;
}
const CountdownCircle = styled.div.attrs<CountdownCircleProps>((props) => ({
  style: {
    background: `conic-gradient(
   #aaa ${props.percent}%,
    #aaa ${props.percent}% ${props.percent}%,
    ${props.color} ${props.percent}%
      )`,
  },
}))<CountdownCircleProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
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
