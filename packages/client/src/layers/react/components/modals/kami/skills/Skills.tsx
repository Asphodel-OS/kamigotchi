import { useState } from "react";
import styled from "styled-components";

import { Details } from "./Details";
import { Matrix } from "./Matrix";
import { Kami } from "layers/network/shapes/Kami";
import { Skill } from "layers/network/shapes/Skill";
import { playClick } from 'utils/sounds';


interface Props {
  kami: Kami;
  skills: Skill[];
  actions: {
    upgrade: Function;
  }
}

export const Skills = (props: Props) => {
  const { skills, kami, actions } = props;
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);


  const triggerUpgrade = (skill: Skill) => {
    playClick();
    actions.upgrade(kami, skill);
  }

  const skill = skills[3];
  return (
    <Wrapper>
      <Text>{`Skill Points: ${props.kami.skillPoints}`}</Text>
      <Details
        data={{ kami, skill }}
        actions={{ upgrade: () => triggerUpgrade(skill) }} />
      <Matrix
        kami={kami}
        skills={skills}
        setHovered={() => { }}
        setSelected={() => { }} />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
`;

const Text = styled.div`
  position: absolute;
  width: 100%;
  justify-self: flex-end;
  padding: 1vw 1vw;

  font-family: Pixel;
  font-size: 1vw;
  text-align: right;
  color: #333;
`;