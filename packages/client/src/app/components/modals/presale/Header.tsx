import styled from 'styled-components';

import { Overlay, Tooltip } from 'app/components/library';
import { getDateString } from 'utils/time';

const StartTime = Math.floor(Date.now() / 1000) + 3600 * 24;

interface Props {
  tick: number;
}

export const Header = (props: Props) => {
  const { tick } = props;

  const getCountdown = () => {
    const diff = StartTime - tick;
    const seconds = Math.floor(diff % 60);
    const minutes = Math.floor((diff / 60) % 60);
    const hours = Math.floor((diff / (60 * 60)) % 24);

    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <Container>
      <Overlay left={0.9} top={0.9}>
        <Text size={0.9}>Mint is Live</Text>
      </Overlay>
      <Overlay right={0.9} top={0.9}>
        <Tooltip text={[`Mint ends ${getDateString(StartTime)}`]} grow>
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
