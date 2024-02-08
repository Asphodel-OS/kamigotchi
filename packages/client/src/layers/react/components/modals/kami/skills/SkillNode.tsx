import { useEffect, useRef } from "react";
import styled from "styled-components";

import { Kami } from "layers/network/shapes/Kami";
import {
  Skill,
  Requirement,
  meetsSkillCost,
  isSkillMaxxed,
  meetsSkillRequirement
} from "layers/network/shapes/Skill";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { playClick } from 'utils/sounds';


interface Props {
  skill: Skill;
  kami: Kami;
  nodeRects: Map<number, DOMRect>;
  setHovered: (skillIndex: number) => void;
  setSelected: (skillIndex: number) => void;
}

export const SkillNode = (props: Props) => {
  const { skill, kami, nodeRects, setHovered, setSelected } = props;
  const myRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (myRef.current) {
      nodeRects.set(skill.index * 1, myRef.current.getBoundingClientRect());
    }
  }, []);

  const handleClick = () => {
    playClick();
    setSelected(skill.index * 1);
  }

  if (!skill) return <></>;
  return (
    <Container key={skill.index} ref={myRef}>
      <Tooltip text={[`${skill.name}`]} key={skill.index}>
        <Image src={skill.uri}
          onClick={handleClick}
          onMouseEnter={() => setHovered(skill.index * 1)}
          onMouseLeave={() => setHovered(0)}
        />
      </Tooltip>
    </Container>
  );
}


const Image = styled.img`
  border: solid black .15vw;
  border-radius: 1.5vw;
  width: 6vw;
  &:hover {
    opacity: 0.6;
  }
`;

const Container = styled.div`
  margin: 1vw;

  pointer-events: auto;
  &:disabled {
    background-color: #b2b2b2;
    cursor: default;
    pointer-events: none;
  }
`;