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
  const [skillMap, setSkillMap] = useState<Map<number, Skill>>();
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [displayed, setDisplayed] = useState(0);

  // keep a hashmap of Skill indices to Skill objects
  useEffect(() => {
    const result = skills.reduce((map: any, obj) => {
      map[obj.index * 1] = obj;
      return map;
    }, {});
    setSkillMap(result);
  }, [skills.length]);

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
      <Text>{`Skill Points: ${props.kami.skillPoints}`}</Text>
      <Details
        data={{ kami, index: displayed, registry: skills }}
        actions={{ upgrade: () => triggerUpgrade(skillMap?.get(displayed)!) }}
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