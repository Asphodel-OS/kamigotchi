import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'layers/network/shapes/Account';
import { Kami } from 'layers/network/shapes/Kami';
import { Skill } from 'layers/network/shapes/Skill';
import { playClick } from 'utils/sounds';
import { Details } from './Details';
import { Matrix } from './Matrix';

interface Props {
  account: Account;
  kami: Kami;
  skills: Skill[]; // registry skills
  actions: {
    upgrade: Function;
  };
}

export const Skills = (props: Props) => {
  // console.log('mSkill:', props.kami);
  const { account, kami, skills, actions } = props;
  const [skillMap, setSkillMap] = useState(new Map<number, Skill>());
  const [displayed, setDisplayed] = useState(0); // index of displayed skill

  // keep a hashmap for easy lookup of Skill Indices => Skill Objects
  useEffect(() => {
    const result = skills.reduce(
      (map, skill) => map.set(skill.index * 1, skill),
      new Map<number, Skill>()
    );
    setSkillMap(result);
  }, [skills.length]);

  ////////////////////
  // INTERACTIONS

  // trigger an upgrade of the skill
  const triggerUpgrade = (skill: Skill) => {
    playClick();
    actions.upgrade(kami, skill);
  };

  ////////////////////
  // RENDER

  return (
    <Wrapper>
      <Details
        data={{ account, kami, index: displayed, skills: skillMap }}
        actions={{ upgrade: (skill: Skill) => triggerUpgrade(skill) }}
      />
      <Matrix
        kami={kami}
        skills={skillMap}
        setDisplayed={(skillIndex) => setDisplayed(skillIndex)}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
`;
