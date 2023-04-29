import React from 'react';
import styled from 'styled-components';

import {
  path_3way1,
  path_corner1,
  path_corner2,
  path_corner3,
  path_horiz,
  path_horiz_joint,
  path_vert,
  path_vert_joint,
  river_corner1,
  river_horiz,
  river_vert,
  tbuilding,
  tforest,
  tgate,
  tjunk,
  tmist,
  tmound,
  tmount,
  twaterfall,
  troom1,
  troom2,
  troom3,
  troom4,
  troom5,
  troom6,
  troom7,
  troom8,
  troom9,
  troom10,
  troom11,
  troom12,
  troom14,
  tshop,
} from '../../../../assets/map';

// 17 x 9
const GRID_MAP = [
  // #9
  [
    null,
    null,
    null,
    tbuilding,
    null,
    null,
    null,
    null,
    null,
    tjunk,
    null,
    null,
    null,
    tforest,
    river_vert,
    tmist,
    tforest,
  ],
  // #8
  [
    null,
    tbuilding,
    tbuilding,
    troom6,
    path_horiz,
    path_corner3,
    null,
    null,
    tjunk,
    tjunk,
    tjunk,
    null,
    tforest,
    tmist,
    river_vert,
    tforest,
    tforest,
  ],
  // #7
  [
    tbuilding,
    tbuilding,
    tbuilding,
    path_vert,
    null,
    path_vert,
    null,
    tjunk,
    tjunk,
    tjunk,
    tjunk,
    null,
    tforest,
    tmist,
    river_corner1,
    river_horiz,
    river_horiz,
  ],
  // #6
  [
    tbuilding,
    troom14,
    path_horiz,
    troom7,
    null,
    path_vert_joint,
    null,
    tjunk,
    tjunk,
    troom12,
    tjunk,
    null,
    null,
    tforest,
    tforest,
    troom1,
    tforest,
  ],
  // #5
  [
    null,
    tbuilding,
    tbuilding,
    path_vert,
    tjunk,
    path_vert,
    tjunk,
    null,
    tjunk,
    path_vert,
    null,
    tjunk,
    null,
    null,
    tforest,
    path_vert,
    tforest,
  ],
  // #4
  [
    null,
    tmount,
    null,
    troom8,
    null,
    troom5,
    path_horiz,
    path_horiz_joint,
    path_horiz,
    troom4,
    tjunk,
    null,
    null,
    tshop,
    tforest,
    path_vert_joint,
    tforest,
  ],
  // #3
  [
    tmount,
    river_vert,
    tmount,
    null,
    tforest,
    path_vert,
    tforest,
    null,
    tjunk,
    path_vert,
    null,
    null,
    tforest,
    path_vert,
    tforest,
    path_vert,
    tforest,
  ],
  // #2
  [
    tmount,
    twaterfall,
    tforest,
    troom11,
    path_horiz,
    troom9,
    path_horiz,
    troom10,
    tforest,
    path_corner1,
    path_horiz,
    troom3,
    path_horiz,
    troom2,
    path_horiz,
    path_corner2,
    tforest,
  ],
  // #1
  [
    tmount,
    tforest,
    tforest,
    tforest,
    tforest,
    tforest,
    tforest,
    tmound,
    null,
    tgate,
    null,
    tforest,
    null,
    tforest,
    tforest,
    tforest,
    tforest,
  ],
];

const Tile = ({ img }) => {
  if (img === null)
    return <div style={{ width: '100%', height: '100%', backgroundColor: 'green' }} />;
  return <img src={img} alt='' style={{ width: '100%', height: '100%' }} />;
};

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(17, 1fr);
  grid-template-rows: repeat(9, 1fr);
  background-color: green;
`;

const GridTile = styled.div`
  position: relative;
`;

const MapGrid = () => {
  return (
    <GridContainer>
      {GRID_MAP.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((tile, colIndex) => (
            <GridTile key={colIndex}>
              <Tile img={tile} />
              {/* {Array.isArray(tile) && (
                <Tile img={tile[1]} style={{ position: 'absolute', top: 0, left: 0 }} />
              )} */}
            </GridTile>
          ))}
        </React.Fragment>
      ))}
    </GridContainer>
  );
};

export default MapGrid;
