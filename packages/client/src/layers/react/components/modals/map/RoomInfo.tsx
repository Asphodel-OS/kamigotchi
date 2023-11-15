import { Divider } from "@mui/material";
import { Room } from "layers/react/shapes/Room";
import styled from "styled-components";
import { playClick } from "utils/sounds";

interface Props {
  room: Room | undefined;
  exits: Room[];
  move: Function;
}

export const RoomInfo = (props: Props) => {
  if (!props.room) return <div />;

  return (
    <Container>
      <Section>
        {props.room.owner && <Description>{props.room.owner.name}</Description>}
        <Description>{props.room.description}</Description>
      </Section>

      <Section>
        <Title>Players</Title>
        <Description>{props.room.players?.map((player) => (player.name)).join(', ')}</Description>
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
