import React, { useState } from 'react';
import styled from 'styled-components';
import { location, road, coreSprites, water } from 'assets/map';
import { dataStore } from 'layers/react/store/createStore';

interface MapProps {
  currentRoom?: number;
  move: Function;
}

// 17 x 9
const GRID_MAP = [
  // #9
  [
    coreSprites.Sprite2,
    coreSprites.Sprite3,
    coreSprites.Sprite4,
    coreSprites.Sprite19,
    coreSprites.Sprite1,
    coreSprites.Sprite2,
    coreSprites.Sprite3,
    coreSprites.Sprite4,
    coreSprites.Sprite1,
    coreSprites.Sprite12,
    coreSprites.Sprite4,
    coreSprites.Sprite2,
    coreSprites.Sprite3,
    coreSprites.Sprite8,
    water.Sprite9,
    coreSprites.Sprite23,
    coreSprites.Sprite7,
  ],
  // #8
  [
    coreSprites.Sprite1,
    coreSprites.Sprite18,
    coreSprites.Sprite20,
    location.Sprite6,
    road.Sprite6,
    road.Sprite8,
    coreSprites.Sprite1,
    coreSprites.Sprite2,
    coreSprites.Sprite10,
    coreSprites.Sprite12,
    coreSprites.Sprite10,
    coreSprites.Sprite4,
    coreSprites.Sprite6,
    coreSprites.Sprite23,
    water.Sprite9,
    coreSprites.Sprite7,
    coreSprites.Sprite8,
  ],
  // #7
  [
    coreSprites.Sprite20,
    coreSprites.Sprite19,
    coreSprites.Sprite17,
    road.Sprite9,
    coreSprites.Sprite1,
    road.Sprite9,
    coreSprites.Sprite4,
    coreSprites.Sprite12,
    coreSprites.Sprite11,
    coreSprites.Sprite10,
    coreSprites.Sprite9,
    coreSprites.Sprite2,
    coreSprites.Sprite5,
    coreSprites.Sprite22,
    water.Sprite10,
    location.Sprite1,
    water.Sprite6,
  ],
  // #6
  [
    coreSprites.Sprite18,
    location.Sprite14,
    road.Sprite6,
    location.Sprite7,
    coreSprites.Sprite3,
    road.Sprite9,
    coreSprites.Sprite2,
    coreSprites.Sprite9,
    coreSprites.Sprite12,
    location.Sprite12,
    coreSprites.Sprite11,
    coreSprites.Sprite4,
    coreSprites.Sprite3,
    coreSprites.Sprite8,
    coreSprites.Sprite6,
    road.Sprite9,
    coreSprites.Sprite5,
  ],
  // #5
  [
    coreSprites.Sprite2,
    coreSprites.Sprite17,
    coreSprites.Sprite19,
    road.Sprite9,
    coreSprites.Sprite9,
    road.Sprite9,
    coreSprites.Sprite10,
    coreSprites.Sprite4,
    coreSprites.Sprite11,
    road.Sprite9,
    coreSprites.Sprite1,
    coreSprites.Sprite10,
    coreSprites.Sprite4,
    coreSprites.Sprite2,
    coreSprites.Sprite6,
    road.Sprite9,
    coreSprites.Sprite8,
  ],
  // #4
  [
    coreSprites.Sprite1,
    coreSprites.Sprite16,
    coreSprites.Sprite1,
    location.Sprite8,
    coreSprites.Sprite1,
    location.Sprite5,
    road.Sprite6,
    road.Sprite6,
    road.Sprite6,
    location.Sprite4,
    coreSprites.Sprite10,
    coreSprites.Sprite2,
    coreSprites.Sprite3,
    location.Sprite13,
    coreSprites.Sprite8,
    road.Sprite9,
    coreSprites.Sprite6,
  ],
  // #3
  [
    coreSprites.Sprite15,
    water.Sprite9,
    coreSprites.Sprite13,
    coreSprites.Sprite4,
    coreSprites.Sprite7,
    road.Sprite9,
    coreSprites.Sprite5,
    coreSprites.Sprite2,
    coreSprites.Sprite10,
    road.Sprite9,
    coreSprites.Sprite4,
    coreSprites.Sprite3,
    coreSprites.Sprite1,
    road.Sprite9,
    coreSprites.Sprite8,
    road.Sprite9,
    coreSprites.Sprite6,
  ],
  // #2
  [
    coreSprites.Sprite14,
    location.Sprite11,
    road.Sprite6,
    road.Sprite6,
    road.Sprite6,
    location.Sprite9,
    road.Sprite6,
    location.Sprite10,
    coreSprites.Sprite8,
    road.Sprite10,
    road.Sprite6,
    location.Sprite3,
    road.Sprite6,
    location.Sprite2,
    road.Sprite6,
    road.Sprite11,
    coreSprites.Sprite7,
  ],
  // #1
  [
    coreSprites.Sprite13,
    coreSprites.Sprite5,
    coreSprites.Sprite6,
    coreSprites.Sprite7,
    coreSprites.Sprite8,
    coreSprites.Sprite5,
    coreSprites.Sprite7,
    coreSprites.Sprite1,
    coreSprites.Sprite3,
    coreSprites.Sprite2,
    coreSprites.Sprite4,
    coreSprites.Sprite7,
    coreSprites.Sprite1,
    coreSprites.Sprite5,
    coreSprites.Sprite6,
    coreSprites.Sprite7,
    coreSprites.Sprite8,
  ],
];

const ROOM_POSITIONS = new Map([
  ['1,3', 6],
  ['3,1', 14],
  ['3,3', 7],
  ['3,9', 12],
  ['5,3', 8],
  ['5,5', 5],
  ['5,9', 4],
  ['2,15', 1],
  ['7,1', 11],
  ['7,5', 9],
  ['7,7', 10],
  ['7,11', 3],
  ['7,13', 2],
  ['5,13', 13],
]);

const NEIGHBOR_ROOMS = [
  [1],
  [2],
  [1, 3, 13],
  [2, 4],
  [3, 5, 12],
  [4, 6, 9],
  [5, 7],
  [6, 8, 14],
  [7],
  [5, 10, 11],
  [9],
  [9],
  [4],
  [2],
  [7],
  [11, 16, 18],
  [15],
  [0],
  [15],
];

const Tile = ({ img, currentRoom, move, rowIndex, colIndex }: any) => {
  const [isHovered, setHovered] = useState(false);
  const { selectedEntities, setSelectedEntities } = dataStore();

  const location = ROOM_POSITIONS.get(`${rowIndex},${colIndex}`);
  const isCurrentRoom = location === currentRoom;
  const isNeighbor = NEIGHBOR_ROOMS[currentRoom]?.includes(location || 0);
  const isClickable = !!location;
  const isTopLeft = rowIndex === 0 && colIndex === 0;
  const isTopRight = rowIndex === 0 && colIndex === 16;

  const clickableStyle = isClickable ? { cursor: 'pointer' } : {};
  const hoveredStyle = isNeighbor
    ? { border: '.15vw solid green', opacity: '0.7' }
    : { border: '.15vw solid red', opacity: '0.7' };
  const currentRoomStyle = (isCurrentRoom)
    ? { border: '.15vw solid transparent', opacity: '0.7' }
    : {};
  const cornerStyle = (isTopLeft) ? { borderRadius: '8px 0px 0px 0px' } : {};
  const cornerStyle2 = (isTopRight) ? { borderRadius: '0px 8px 0px 0px' } : {};

  const handleMouseEnter = () => {
    if (isClickable) {
      setHovered(true);
      setSelectedEntities({ ...selectedEntities, room: location * 1 });
    }
  };

  const handleMouseLeave = () => {
    if (isClickable) {
      setHovered(false);
      setSelectedEntities({ ...selectedEntities, room: currentRoom * 1 });
    }
  };

  if (!img) return <div style={{ width: '100%', height: '100%' }} />;

  return (
    <TileImage
      src={img}
      style={{
        ...currentRoomStyle,
        ...clickableStyle,
        ...(isHovered ? hoveredStyle : {}),
        ...cornerStyle,
        ...cornerStyle2,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={isClickable && isNeighbor ? () => move(location) : undefined}
    />
  );
};


export const MapGrid = ({ currentRoom, move }: MapProps) => {
  return (
    <GridContainer>
      {GRID_MAP.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((tile, colIndex) => (
            <Tile
              key={colIndex}
              img={tile}
              currentRoom={currentRoom}
              move={move}
              rowIndex={rowIndex}
              colIndex={colIndex}
            />
          ))}
        </React.Fragment>
      ))}
    </GridContainer>
  );
};


const GridContainer = styled.div`
  border-radius: 8px 8px 0px 0px;
  display: grid;
  grid-template-columns: repeat(17, 1fr);
  grid-template-rows: repeat(9, 1fr);
  background-color: white;
  width: 100%;
  height: 100%;
`;

const TileImage = styled.img`
  position: relative;
  width: 100%;
  height: 100%;
`;