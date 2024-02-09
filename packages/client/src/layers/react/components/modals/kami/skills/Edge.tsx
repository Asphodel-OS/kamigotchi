import React from 'react';
import styled from 'styled-components';

interface Props {
  from: number;
  to: number;
  baseRect: DOMRect | undefined;
  nodeRects: Map<number, DOMRect>;
}

export const Edge = (props: Props) => {
  const { from, to, baseRect, nodeRects } = props;
  const rect1 = nodeRects.get(from);
  const rect2 = nodeRects.get(to);

  if (!baseRect || !rect1 || !rect2) return <></>;

  // get the relative coordinates of node1
  const x1 = rect1.x + rect1.width / 2 - baseRect.x;
  const y1 = rect1.y + rect1.height / 2 - baseRect.y;

  // get the relative coordinates of node2
  const x2 = rect2.x + rect2.width / 2 - baseRect.x;
  const y2 = rect2.y + rect2.height / 2 - baseRect.y;

  // calculate the length and angle of the line
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  return <Line x={x1} y={y1} len={len} angle={angle} />;
}

const Line = styled.div<{ x: number, y: number, len: number, angle: number }>`
  position: absolute;
  border-radius: 1vw;
  border: solid gray .15vw;
  background: black;
  height: 10px;

  width: ${({ len }) => `${len}`}px;
  left: ${({ x }) => `${x}`};
  top: ${({ y }) => `${y}`};
  rotate: ${({ angle }) => `${angle}`}deg;
  transform-origin: left center;
  z-index: 0;
`;