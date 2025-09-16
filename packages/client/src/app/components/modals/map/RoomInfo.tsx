import styled from 'styled-components';

import { Room } from 'network/shapes/Room';

export const RoomInfo = ({
  index,
  rooms,
}: {
  index: number; // index of displayed room
  rooms: Map<number, Room>;
}) => {
  if (index == 0 || !rooms.has(index)) return <div />;
  const room = rooms.get(index)!;

  ///////////////////
  // RENDER

  return (
    <Container>
      <Title>{room.name}</Title>
      {room.owner && <Description>{room.owner.name}</Description>}
      <Description>{room.description}</Description>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  width: 100%;
  height: 100%;
`;

const Title = styled.div`
  position: absolute;
  padding: 0.7rem;
  width: 100%;
  background-color: #eee;

  color: #333;
  font-family: Pixel;
  font-size: 0.9rem;
  text-align: left;
`;

const Description = styled.div`
  color: #333;
  width: 100%;
  padding: 1.5rem;
  margin-top: 1.5rem;

  font-family: Pixel;
  font-size: 0.6rem;
  text-align: left;
  line-height: 1.2rem;
  overflow-y: scroll;
`;
