import styled from 'styled-components';

import { Room } from 'layers/network/shapes/Room';

interface Props {
  index: number; // index of displayed room
  rooms: Map<number, Room>;
}

export const Players = (props: Props) => {
  const { index, rooms } = props;
  if (index == 0 || !rooms.has(index)) return <div />;
  const room = rooms.get(index)!;

  ///////////////////
  // RENDER

  return (
    <Container>
      <Title>Players</Title>
      <Description>{room.players?.map((player) => player.name).join(', ')}</Description>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  width: 100%;
  height: 100%;
  margin: 1vw;
`;

const Title = styled.p`
  color: #333;
  padding-bottom: 0.5vw;

  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
`;

const Description = styled.p`
  color: #333;
  padding: 0.3vw;

  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
  line-height: 1.2vw;
`;
