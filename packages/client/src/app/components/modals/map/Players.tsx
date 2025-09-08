import styled from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { Room } from 'network/shapes/Room';
import { playClick } from 'utils/sounds';

export const Players = ({
  index,
  rooms,
}: {
  index: number; // index of displayed room
  rooms: Map<number, Room>;
}) => {
  const room = rooms.get(index)!;

  const setAccount = useSelected((s) => s.setAccount);
  const setModals = useVisibility((s) => s.setModals);

  ///////////////////
  // INTERACTION

  const handleClick = (playerIndex: number) => {
    playClick();
    setAccount(playerIndex);
    setModals({ account: true, map: false });
  };

  ///////////////////
  // RENDER

  if (index == 0 || !rooms.has(index)) return <div />;
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
  position: relative;
  display: flex;
  flex-direction: column;

  height: 6vw;
  width: 100%;
`;

const Title = styled.div`
  position: absolute;
  padding: 0.6vw;
  width: 100%;
  background-color: #eee;

  color: #333;
  font-family: Pixel;
  font-size: 0.9vw;
  text-align: left;
`;

const PlayerRow = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  padding: 0.3vw;
  padding-top: 2.7vw;

  width: 100%;
  height: 100%;
  overflow-y: scroll;
`;

const Player = styled.div`
  color: #333;
  padding: 0.3vw;

  font-family: Pixel;
  font-size: 0.75vw;
  text-align: left;
  line-height: 1.2vw;

  &:hover {
    opacity: 0.6;
    cursor: pointer;
    background-color: #ddd;
    border-radius: 0.45vw;
  }
`;
