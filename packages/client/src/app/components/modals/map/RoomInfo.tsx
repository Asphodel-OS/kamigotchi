import styled from 'styled-components';

import { Room } from 'network/shapes/Room';

interface Props {
  index: number; // index of displayed room
  rooms: Map<number, Room>;
}

export const RoomInfo = (props: Props) => {
  const { index, rooms } = props;
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
  padding: 0.7vw;
  width: 100%;
  background-color: #eee;

  color: #333;
  font-family: Pixel;
  font-size: 0.9vw;
  text-align: left;
`;

const Description = styled.div`
  color: #333;
  width: 100%;
  padding: 1.5vw;
  margin-top: 1.5vw;

  font-family: Pixel;
  font-size: 0.6vw;
  text-align: left;
  line-height: 1.2vw;
  overflow-y: scroll;
`;
