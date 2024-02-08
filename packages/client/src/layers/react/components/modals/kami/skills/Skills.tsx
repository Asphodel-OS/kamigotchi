import { useEffect, useState } from "react";
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
  const [skillMap, setSkillMap] = useState(new Map<number, Skill>());
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [displayed, setDisplayed] = useState(0);

  // keep a hashmap of Skill indices to Skill objects for easy lookup
  useEffect(() => {
    const result = skills.reduce((map: Map<number, Skill>, skill) => {
      map.set(skill.index * 1, skill);
      return map;
    }, new Map<number, Skill>());
    setSkillMap(result);
  }, [skills.length]);

  // set index of the displayed skill, based on the hovered and selected
  useEffect(() => {
    if (hovered !== 0) setDisplayed(hovered);
    else if (selected !== 0) setDisplayed(selected);
    else setDisplayed(1);
  }, [selected, hovered]);


  ////////////////////
  // INTERACTIONS 

  // trigger an upgrade of the skill
  const triggerUpgrade = (skill: Skill) => {
    playClick();
    actions.upgrade(kami, skill);
  }


  ////////////////////
  // RENDER

  return (
    <Wrapper>
      <Details
        data={{ kami, index: displayed, registry: skills }}
        actions={{ upgrade: (skill: Skill) => triggerUpgrade(skill) }}
      />
      <Matrix
        kami={kami}
        skills={skillMap}
        setHovered={(skillIndex) => setHovered(skillIndex)}
        setSelected={(skillIndex) => setSelected(skillIndex)}
      />
    </Wrapper>
  );
}


const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
`;

