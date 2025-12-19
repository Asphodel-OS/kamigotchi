import styled from 'styled-components';

import { Kami } from 'network/shapes';
import { Cooldown } from './Cooldown';
import { Health } from './Health';

export const TitleBar = ({
  kami,
  onClick,
  show,
  tick,
}: {
  kami: Kami;
  onClick: () => void;
  show?: {
    battery?: boolean;
    cooldown?: boolean;
  };
  tick: number;
}) => {
  /////////////////
  // RENDER

  return (
    <Container>
      <Title key='title' onClick={onClick}>
        {kami.name}
      </Title>
      {show?.battery && <Health kami={kami} tick={tick} />}
      {show?.cooldown && (
        <Corner key='corner'>
          <Cooldown kami={kami} tick={tick} />
        </Corner>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-bottom: solid black 0.15em;
  height: 1.8em;

  display: flex;
  align-items: center;
  justify-content: flex-start;
  user-select: none;
`;

const Title = styled.div`
  position: absolute;
  z-index: 1;
  font-size: 0.7em;
  margin-left: 0.6em;

  text-align: left;
  color: #4b126eff;
  cursor: pointer;

  &:hover {
    opacity: 0.6;
    text-decoration: underline;
  }
`;

const Corner = styled.div`
  flex-grow: 1;
  width: 2.7em;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: flex-end;
`;
