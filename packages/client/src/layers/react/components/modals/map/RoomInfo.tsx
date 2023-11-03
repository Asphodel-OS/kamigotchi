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

  const handleClick = (location: number) => {
    playClick();
    props.move(location);
  }

  return (
    <>
      <SectionContainer>
        {props.room.owner && <Description>{props.room.owner.name}</Description>}
        <Description>{props.room.description}</Description>
      </SectionContainer>

      <SectionContainer>
        <SectionTitle>Exits</SectionTitle>
        {props.exits.map((exit) => {
          return (
            <ClickableDescription key={exit.location} onClick={() => handleClick(exit.location)}>
              → {exit.name}
            </ClickableDescription>
          );
        })}
      </SectionContainer>

      <SectionContainer>
        <SectionTitle>Players</SectionTitle>
        <Description>{props.room.players?.map((player) => (player.name)).join(', ')}</Description>
      </SectionContainer>
    </>
  );
};


const SectionContainer = styled.div`
  margin: 1.2vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const SectionTitle = styled.p`
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

// TODO: merge this with Description using props
const ClickableDescription = styled.div`
  color: #333;
  cursor: pointer;
  padding: .3vw;
  
  font-size: .8vw;
  font-family: Pixel;
  text-align: left;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;