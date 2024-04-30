import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { RoomAsset, rooms } from 'constants/rooms';
import { triggerDialogueModal } from 'layers/phaser/utils/triggers/triggerDialogueModal';

interface Props {
  index: number;
}

// painting of the room alongside any clickable objects
export const Room = (props: Props) => {
  const { index } = props;
  const [room, setRoom] = useState(rooms[0]);

  useEffect(() => {
    if (!!index) setRoom(rooms[index]);
  }, [index]);

  const getBackground = () => {
    return room.background.path;
  };

  const getClickbox = (object: RoomAsset) => {
    console.log(object);
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
    return <Clickbox x1={x1} y1={y1} x2={x2} y2={y2} onClick={onClick} />;
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
  background-color: blue;
  position: absolute;
  top: ${(props) => props.y1}%;
  left: ${(props) => props.x1}%;
  width: ${(props) => props.x2 - props.x1}%;
  height: ${(props) => props.y2 - props.y1}%;

  cursor: pointer;
  pointer-events: auto;
  opacity: 0.2;
`;
