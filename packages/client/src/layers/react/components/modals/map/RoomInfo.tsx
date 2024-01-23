import { Room } from "layers/network/shapes/Room";
import styled from "styled-components";

interface Props {
  room: Room | undefined;
}

export const RoomInfo = (props: Props) => {
  const { room } = props;
  if (!room) return <div />;

  return (
    <Container>
      <Section>
        {room.owner && <Description>{room.owner.name}</Description>}
        <Description>{room.description}</Description>
      </Section>
      <Section>
        <Title>Players</Title>
        <Description>{room.players?.map((player) => (player.name)).join(', ')}</Description>
      </Section>
    </ Container>
  );
};


const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  width: 100%;
  height: 100%;
  padding: 1vw;
`;

const Section = styled.div`
  margin: 1vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const Title = styled.p`
  color: #333;
  padding-bottom: .5vw;

  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
`;

const Description = styled.p`
  color: #333;
  padding: .3vw;
  
  font-family: Pixel;
  font-size: .8vw;
  text-align: left;
  line-height: 1.2vw;
`;
