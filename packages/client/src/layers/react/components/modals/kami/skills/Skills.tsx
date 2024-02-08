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
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [displayed, setDisplayed] = useState(0);

  // set index of the displayed skill, based on the hovered and selected
  useEffect(() => {
    if (hovered !== 0) setDisplayed(hovered);
    else if (selected !== 0) setDisplayed(selected);
    else setDisplayed(1);
  }, [selected, hovered]);

  const triggerUpgrade = (skill: Skill) => {
    playClick();
    actions.upgrade(kami, skill);
  }

  return (
    <Wrapper>
      <Details
        data={{ kami, index: displayed, registry: skills }}
        actions={{ upgrade: (skill: Skill) => triggerUpgrade(skill) }}
      />
      <Matrix
        kami={kami}
        skills={skills}
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

