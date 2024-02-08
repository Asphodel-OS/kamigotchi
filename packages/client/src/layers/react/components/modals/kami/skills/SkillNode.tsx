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
  setHovered: (skillIndex: number) => void;
  setSelected: (skillIndex: number) => void;
}

interface TextBool {
  text: string;
  bool: boolean;
}

export const SkillNode = (props: Props) => {
  const { skill, kami, setHovered, setSelected } = props;

  const handleClick = () => {
    playClick();
    setSelected(skill.index * 1);
  }

  return (
    <Tooltip text={[skill.name]} key={skill.index}>
      <Container key={skill.index}>
        <Image src={skill.uri}
          onClick={handleClick}
          onMouseEnter={() => setHovered(skill.index * 1)}
          onMouseLeave={() => setHovered(0)}
        />
      </Container>
    </Tooltip>
  );
}


const Image = styled.img`
  border-radius: 1.5vw;
  width: 5vw;
`;

const Container = styled.button`
  border: solid black  .14vw;
  border-radius: 1vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  margin: 0.8vw;
  padding: 0.5vw;
  width: 6vw;
  height: 5vw;

  background-color: #fff;
  pointer-events: auto;
  &:hover {
    box-shadow: 0 0 11px rgba(33,33,33,.2);
    background-color: #ddd;
    cursor: pointer;
  }
  &:active {
    box-shadow: 0 0 16px rgba(11,11,11,.2); 
    background-color: #999;
    cursor: pointer;
  }
  &:disabled {
    background-color: #b2b2b2;
    cursor: default;
    pointer-events: none;
  }
`;

const Name = styled.div`
  font-family: Pixel;
  font-size: .7vw;
  text-align: center;
  justify-content: center;
  color: #333;
  padding: .4vw;
`;