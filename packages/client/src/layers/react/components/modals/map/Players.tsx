import styled from 'styled-components';

import { Room } from 'layers/network/shapes/Room';
import { useSelected, useVisibility } from 'layers/react/store';
import { playClick } from 'utils/sounds';

interface Props {
  index: number; // index of displayed room
  rooms: Map<number, Room>;
}

export const Players = (props: Props) => {
  const { index, rooms } = props;
  if (index == 0 || !rooms.has(index)) return <div />;
  const room = rooms.get(index)!;

  const { setAccount } = useSelected();
  const { modals, setModals } = useVisibility();

  ///////////////////
  // INTERACTION

  const handleClick = (playerIndex: number) => {
    playClick();
    setAccount(playerIndex);
    setModals({ ...modals, account: true, map: false });
  };

  ///////////////////
  // RENDER

  return (
    <Container>
      <Title>Players</Title>
      <PlayerRow>
        {room.players?.map((player) => (
          <Player key={player.index} onClick={() => handleClick(player.index)}>
            {player.name}
          </Player>
        ))}
      </PlayerRow>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  width: 100%;
  height: 5vw;
  padding: 1vw;
`;

const Title = styled.p`
  color: #333;
  padding-bottom: 0.5vw;

  font-family: Pixel;
  font-size: 0.6vw;
  text-align: left;
`;

const PlayerRow = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;

  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const Player = styled.p`
  color: #333;
  padding: 0.3vw;

  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
  line-height: 1.2vw;

  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }
`;
