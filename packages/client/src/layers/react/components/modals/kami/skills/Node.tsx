import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { Kami } from "layers/network/shapes/Kami";
import { Skill } from "layers/network/shapes/Skill";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { playClick } from 'utils/sounds';


interface Props {
  skill: Skill;
  kami: Kami;
  nodeRects: Map<number, DOMRect>;
  setNodeRects: (nodeRects: Map<number, DOMRect>) => void;
  setHovered: (skillIndex: number) => void;
  setSelected: (skillIndex: number) => void;
}

export const Node = (props: Props) => {
  const { skill, nodeRects, setNodeRects, setHovered, setSelected } = props;
  const myRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Function to update the bounding rectangle
    const updateRect = () => {
      if (myRef.current) {
        const newRect = myRef.current.getBoundingClientRect();
        setNodeRects(new Map(nodeRects.set(skill.index * 1, newRect)));
      }
    };

    // Set up a resize observer to update the rectangle when the window resizes
    const resizeObserver = new ResizeObserver(updateRect);
    if (myRef.current) resizeObserver.observe(myRef.current);
    return () => {
      if (myRef.current) resizeObserver.unobserve(myRef.current);
    };
  }, []);


  const handleClick = () => {
    playClick();
    setSelected(skill.index * 1);
  }

  if (!skill) return <></>;
  return (
    <Container key={skill.index} ref={myRef}>
      <Tooltip text={[`${skill.name}`]} key={skill.index}>
        <Image
          src={skill.uri}
          onClick={handleClick}
          onMouseEnter={() => setHovered(skill.index * 1)}
          onMouseLeave={() => setHovered(0)}
        />
      </Tooltip>
    </Container>
  );
}


const Image = styled.img`
  border-radius: 1.5vw;
  
  width: 6vw;
  &:hover {
    opacity: 0.6;
  }
`;

const Container = styled.div`
  border: solid black .15vw;
  border-radius: 1.5vw;
  margin: 1vw;
  
  background-color: black;
  z-index: 1;
  pointer-events: auto;
`;