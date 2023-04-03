import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  room1,
  room2,
  room3,
  room4,
  room5,
  room6,
  room7,
  room8,
  room9,
  room10,
  room11,
  room12,
  room13,
  room14,
} from 'assets/images/rooms';

const MapContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
`;

interface LocationImageProps {
  highlight: boolean;
}

const LocationImage = styled.img<LocationImageProps>`
  position: relative;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  z-index: 6;
  filter: ${(props) =>
    props.highlight ? 'drop-shadow(0px 0px 10px yellow)' : 'none'};
`;

interface RoomLocation {
  key: string;
  room: string;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
}

function createLine(
  from: string,
  to: string,
  roomRefsObj: Record<string, HTMLDivElement> | any
) {
  const [fromRef, toRef] = [roomRefsObj[from], roomRefsObj[to]];

  const line = document.createElement('div'); // Create a new div element to draw the line
  line.style.position = 'absolute';
  line.style.width = '3px';
  line.style.height = '55px';
  line.style.backgroundColor = 'black';
  line.style.left = 17 + 'px'; // Position the line relative to the rooms
  line.style.top = 17 + 'px';
  line.style.transformOrigin = 'top';
  line.style.zIndex = '1';

  const angle =
    (Math.atan2(
      toRef.offsetTop - fromRef.offsetTop,
      toRef.offsetLeft - fromRef.offsetLeft
    ) *
      180) /
      Math.PI -
    90;

  line.style.transform = `rotate(${angle}deg)`; // Rotate the line to point towards the destination room
  roomRefsObj[from].appendChild(line); // Append the line to the parent node of the from room
}

// from -> to
const roomConnections: string[][] = [
  ['room2', 'room1'],
  ['room3', 'room2'],
  ['room13', 'room2'],
  ['room4', 'room3'],
  ['room12', 'room4'],
  ['room4', 'room5'],
  ['room5', 'room4'],
  ['room6', 'room5'],
  ['room9', 'room5'],
  ['room9', 'room10'],
  ['room11', 'room9'],
  ['room7', 'room6'],
  ['room8', 'room7'],
  ['room14', 'room7'],
];

interface MapProps {
  highlightedRoom?: string;
}

const roomLocations: RoomLocation[] = [
  {
    key: 'room8',
    room: room8,
    position: { right: '50px', top: '30px' },
  },
  {
    key: 'room14',
    room: room14,
    position: { left: '50px', bottom: '5px' },
  },
  {
    key: 'room7',
    room: room7,
    position: { top: '10px' },
  },
  {
    key: 'room6',
    room: room6,
    position: { top: '30px' },
  },
  {
    key: 'room11',
    room: room11,
    position: { bottom: '5px', right: '70px' },
  },
  {
    key: 'room5',
    room: room5,
    position: { top: '15px' },
  },
  {
    key: 'room9',
    room: room9,
    position: { bottom: '20px', right: '70px' },
  },
  {
    key: 'room10',
    room: room10,
    position: { right: '70px' },
  },
  {
    key: 'room4',
    room: room4,
    position: { top: '20px' },
  },
  {
    key: 'room12',
    room: room12,
    position: { bottom: '15px', right: '70px' },
  },
  { key: 'room3', room: room3 },
  {
    key: 'room2',
    room: room2,
    position: { top: '20px' },
  },
  {
    key: 'room13',
    room: room13,
    position: { bottom: '15px', right: '70px' },
  },
  { key: 'room1', room: room1 },
];

export const Map = ({ highlightedRoom }: MapProps) => {
  const [locationDivs, setLocationDivs] = useState<JSX.Element[]>([]);
  const roomRefs = useRef<Record<string, HTMLDivElement>>({});

  useEffect(() => {
    Promise.resolve().then(() => {
      const divs = roomLocations.map(({ key, room, position }) => (
        <div
          key={key}
          style={{ position: 'relative', ...position }}
          ref={(ref) => {
            if (ref) roomRefs.current[key] = ref;
          }}
        >
          <LocationImage
            src={room}
            alt={`Room ${key}`}
            highlight={key === highlightedRoom}
          />
        </div>
      ));

      setLocationDivs(divs);
    });
  }, []);

  useEffect(() => {
    if (locationDivs.length)
      setTimeout(() => {
        roomConnections.forEach(([from, to]) => {
          createLine(from, to, roomRefs.current);
        });
      }, 1000);
  }, [locationDivs]);

  return <MapContainer>{locationDivs}</MapContainer>;
};
