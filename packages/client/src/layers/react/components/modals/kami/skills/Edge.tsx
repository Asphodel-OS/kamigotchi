import { useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props {
  from: number;
  to: number;
  baseRect: DOMRect;
  nodeRects: Map<number, DOMRect>;
}

export const Edge = (props: Props) => {
  const { from, to, baseRect, nodeRects } = props;
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [len, setLen] = useState(0);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const rect1 = nodeRects.get(from);
    const rect2 = nodeRects.get(to);
    if (!baseRect || !rect1 || !rect2) return;

    // get the relative coordinates of our nodes
    const x1 = rect1.x + rect1.width / 2 - baseRect.x;
    const y1 = rect1.y + rect1.height / 2 - baseRect.y;
    const x2 = rect2.x + rect2.width / 2 - baseRect.x;
    const y2 = rect2.y + rect2.height / 2 - baseRect.y;

    // set our origin, len and angle
    setX(x1);
    setY(y1);
    setLen(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2));
    setAngle(Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI));
  }, [nodeRects]);

  return <Line x={x} y={y} len={len} angle={angle} />;
};

const Line = styled.div<{ x: number; y: number; len: number; angle: number }>`
  position: absolute;
  border-radius: 1vw;
  border: solid gray 0.15vw;
  background: black;
  height: 10px;

  width: ${({ len }) => `${len}`}px;
  left: ${({ x }) => `${x}`};
  top: ${({ y }) => `${y}`};
  rotate: ${({ angle }) => `${angle}`}deg;
  transform-origin: left center;
  z-index: 0;
`;
