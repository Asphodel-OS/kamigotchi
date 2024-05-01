import { Howl } from 'howler';
import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { RoomAsset, rooms } from 'constants/rooms';
import { triggerDialogueModal } from 'layers/react/triggers/triggerDialogueModal';

interface Props {
  index: number;
}

// painting of the room alongside any clickable objects
export const Room = (props: Props) => {
  const { index } = props;
  const [room, setRoom] = useState(rooms[0]);
  const [bgm, setBgm] = useState<Howl>();

  // Set the new room when the index changes. If the new room has new music,
  // stop the old bgm and play the new one. Global howler audio is controlled
  // in the Volume Settings modal. This recreates any new music from scratch,
  // but ideally we should keep all played tracks in a state map for reuse.
  useEffect(() => {
    console.log('Room index detected', index);
    if (!index || index == room.roomIndex) return;
    console.log('Switching to room', index);
    const newRoom = rooms[index];

    const music = newRoom.music;
    if (music && music.path !== room.music?.path) {
      const newBgm = new Howl({ src: [music.path], loop: true });
      if (bgm) bgm.stop();
      newBgm.play();
      setBgm(newBgm);
    }

    setRoom(newRoom);
  }, [index]);

  // return the background path for now
  // TODO: have this detect time of day based on kamidays (32hrs) and return the correct bg
  const getBackground = () => {
    return room.background.path;
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
      <Background src={getBackground()} />
      {room.objects.map((object) => getClickbox(object))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: absolute;
  width: auto;
  height: 100%;
  z-index: -2;
`;

const Background = styled.img`
  width: 100%;
  height: 100%;
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
  position: absolute;
  top: ${(props) => props.y1}%;
  left: ${(props) => props.x1}%;
  width: ${(props) => props.x2 - props.x1}%;
  height: ${(props) => props.y2 - props.y1}%;

  cursor: pointer;
  pointer-events: auto;
  opacity: 0.2;

  &:hover {
    animation: ${({}) => shimmer} 2s linear infinite;
    background: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 1) 25%, transparent 50%);
    background-size: 200% 100%;
  }
`;

const shimmer = keyframes`
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
`;
