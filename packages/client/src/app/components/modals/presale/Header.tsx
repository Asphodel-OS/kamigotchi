import styled from 'styled-components';

import { Overlay, Tooltip } from 'app/components/library';
import { formatCountdown, getDateString } from 'utils/time';

const StartTime = 1745845200; // April 28th, 2025 – 12am GMT
const EndTime = StartTime + 3600 * 24 * 2;

interface Props {
  tick: number;
}

export const Header = (props: Props) => {
  const { tick } = props;

  const getStatus = () => {
    if (tick < StartTime) return 'Soon';
    if (tick < EndTime) return 'Live';
    return 'Over';
  };

  const getCountdown = () => {
    if (tick < StartTime) return formatCountdown(StartTime - tick);
    if (tick < EndTime) return formatCountdown(EndTime - tick);
    return formatCountdown(0);
  };

  const getCountdownTooltip = () => {
    if (tick < StartTime) return [`Mint starts ${getDateString(StartTime, 0)}`];
    if (tick < EndTime) return [`Mint ends ${getDateString(EndTime, 0)}`];
    return [`Mint has ended`, '', `Thank you for your participation!`];
  };

  return (
    <Container>
      <Overlay left={0.9} top={0.9}>
        <Text size={0.9}>Mint is {getStatus()}</Text>
      </Overlay>
      <Overlay right={0.9} top={0.9}>
        <Tooltip text={getCountdownTooltip()} alignText='center' grow>
          <Text size={0.9}>{getCountdown()}</Text>
        </Tooltip>
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
