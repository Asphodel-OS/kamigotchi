import styled from 'styled-components';

import { Room } from 'layers/network/shapes/Room';

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
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  width: 100%;
  height: 100%;
  margin: 0.5vw 1vw;
`;

const Title = styled.div`
  color: #333;
  padding-bottom: 0.5vw;

  font-family: Pixel;
  font-size: 0.9vw;
  text-align: left;
`;

const Description = styled.div`
  color: #333;
  padding: 0.3vw;

  font-family: Pixel;
  font-size: 0.75vw;
  text-align: left;
  line-height: 1.2vw;
`;
