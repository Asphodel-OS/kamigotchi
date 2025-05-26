import styled from 'styled-components';

import { Overlay, TextTooltip } from 'app/components/library';
import { formatCountdown, getDateString } from 'utils/time';

interface Props {
  time: {
    now: number;
    start: number;
    end: number;
  };
}

export const Header = (props: Props) => {
  const { time } = props;
  const { now, start, end } = time;

  const getStatus = () => {
    if (now < start) return 'Soon';
    if (now < end) return 'Live';
    return 'Over';
  };

  const getCountdown = () => {
    if (now < start) return formatCountdown(start - now);
    if (now < end) return formatCountdown(end - now);
    return formatCountdown(0);
  };

  const getCountdownTooltip = () => {
    if (now < start) return [`Mint starts ${getDateString(start, 0)}`];
    if (now < end) return [`Mint ends ${getDateString(end, 0)}`];
    return [`Mint has ended`, '', `Thank you for your participation!`];
  };

  return (
    <Container>
      <Overlay left={0.9} top={0.9}>
        <Text size={0.9}>Mint is {getStatus()}</Text>
      </Overlay>
      <Overlay right={0.9} top={0.9}>
        <TextTooltip text={getCountdownTooltip()} alignText='center' grow>
          <Text size={0.9}>{getCountdown()}</Text>
        </TextTooltip>
      </Overlay>
      <Title>$ONYX Presale</Title>
    </Container>
  );
};

const Container = styled.div`
  position: relative;

  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`;

const Title = styled.div`
  color: #d0fe41;
  font-size: 2.4vw;
  margin-top: 4.8vh;

  user-select: none;
`;

const Text = styled.div<{ size: number }>`
  color: #d0fe41;
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;

  user-select: none;
`;
