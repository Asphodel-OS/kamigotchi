import { Howl } from 'howler';
import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { triggerDialogueModal } from 'app/triggers/triggerDialogueModal';
import { RoomAsset, rooms } from 'constants/rooms';
import { Goal } from 'network/shapes/Goals';
import { getCurrPhase } from 'utils/time';

interface Props {
  index: number;
  goals: Goal[];
}

const RoomsBgm: Map<string, Howl> = new Map<string, Howl>();

// painting of the room alongside any clickable objects
export const Room = (props: Props) => {
  const { index, goals } = props;
  const { modals, setModals } = useVisibility();
  const { setNode } = useSelected();
  const [room, setRoom] = useState(rooms[0]);
  const [bgm, setBgm] = useState<Howl>();

  // Set the new room when the index changes. If the new room has new music,
  // stop the old bgm and play the new one. Global howler audio is controlled
  // in the Volume Settings modal. This recreates any new music from scratch,
  // but ideally we should keep all played tracks in a state map for reuse.
  useEffect(() => {
    if (index == room.index) return;
    const newRoom = rooms[index];
    const music = newRoom.music;
    if (!music) bgm?.stop();
    else if (music.path !== room.music?.path) {
      if (!RoomsBgm.has(music.path)) {
        RoomsBgm.set(music.path, new Howl({ src: [music.path], loop: true }));
      }
      const newBgm = RoomsBgm.get(music.path);
      if (bgm) bgm.stop();
      newBgm?.play();
      setBgm(newBgm);
      newBgm?.fade(0, 1, 3000);
    }

    setRoom(newRoom);
    setNode(index);
    closeModals();
  }, [index]);

  const closeModals = () => {
    setModals({
      accountOperator: false,
      bridgeERC20: false,
      bridgeERC721: false,
      emaBoard: false,
      gacha: false,
      goal: false,
      kami: false,
      leaderboard: false,
      merchant: false,
      nameKami: false,
      operatorFund: false,
      dialogue: false,
    });
  };

  // return the background path for now
  const getBackground = () => {
    // phases start at 1, make start at 0
    const phase = (getCurrPhase() - 1) % room.backgrounds.length;
    return room.backgrounds[phase];
  };

  const getClickbox = (object: RoomAsset) => {
    let coords = object.coordinates;
    if (!coords) return;
    const scale = 100 / 128;
    const x1 = coords.x1 * scale;
    const y1 = coords.y1 * scale;
    const x2 = coords.x2 * scale;
    const y2 = coords.y2 * scale;

    let onClick = (() => {}) as React.MouseEventHandler<HTMLDivElement>;
    if (object.dialogue) onClick = () => triggerDialogueModal(object.dialogue!);
    else if (object.onClick) onClick = object.onClick;
    return <Clickbox key={object.name} x1={x1} y1={y1} x2={x2} y2={y2} onClick={onClick} />;
  };

  ///////////////////
  // RENDER

  return (
    <Wrapper>
      <Container>
        <Background draggable='false' src={getBackground()} />
        {room.objects.map((object) => getClickbox(object))}
      </Container>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: absolute;
  width: auto;
  height: 100%;
  z-index: -2;
`;

const Container = styled.div`
  position: relative;
  width: auto;
  height: auto;
`;

const Background = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;
interface Coordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const Clickbox = styled.div<Coordinates>`
  border-radius: 3vw;
  position: absolute;
  top: ${({ y1 }) => y1}%;
  left: ${({ x1 }) => x1}%;
  width: ${({ x1, x2 }) => x2 - x1}%;
  height: ${({ y1, y2 }) => y2 - y1}%;

  cursor: pointer;
  pointer-events: auto;
  opacity: 0.2;

  &:hover {
    animation: ${({}) => shimmer} 1.5s linear infinite;
    background: radial-gradient(
      closest-side,
      rgba(255, 255, 255, 1) 0%,
      rgba(80, 80, 205, 1) 70%,
      rgba(80, 80, 80, 0) 90%
    );
  }
`;

const shimmer = keyframes`
  0% {
    transform: scale(1);
    opacity: 0;
  }
  20% {
    transform: scale(1.2);
    opacity: .2;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
`;
