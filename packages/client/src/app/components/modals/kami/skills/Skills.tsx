import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { SkillImages } from 'assets/images/skills';
import { Account } from 'layers/network/shapes/Account';
import { Kami } from 'layers/network/shapes/Kami';
import { Skill } from 'layers/network/shapes/Skill';
import { Details } from './Details';
import { Matrix } from './matrix/Matrix';

interface Props {
  account: Account;
  kami: Kami;
  skills: Skill[]; // registry skills
  actions: {
    upgrade: (skill: Skill) => void;
  };
  utils: {
    getUpgradeError: (index: number, registry: Map<number, Skill>) => string[] | undefined;
    getTreePoints: (tree: string) => number;
  };
}

export const Skills = (props: Props) => {
  // console.log('mSkill:', props.kami);
  const { account, kami, skills, actions, utils } = props;
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
  // INTERPRETATION

  const getSkillImage = (skill: Skill) => {
    const imageKey = skill.name.toLowerCase().replace(' ', '_') as keyof typeof SkillImages;
    return SkillImages[imageKey] ?? skill.image;
  };

  ////////////////////
  // RENDER

  return (
    <Wrapper>
      <Details
        account={account}
        kami={kami}
        index={displayed}
        skills={skillMap}
        actions={{ upgrade: actions.upgrade }}
        upgradeError={utils.getUpgradeError(displayed, skillMap)}
        utils={{
          getSkillImage,
          getTreePoints: utils.getTreePoints,
        }}
      />
      <Matrix
        kami={kami}
        skills={skillMap}
        setDisplayed={(skillIndex) => setDisplayed(skillIndex)}
        utils={{
          getUpgradeError: (index: number) => utils.getUpgradeError(index, skillMap),
          getTreePoints: utils.getTreePoints,
        }}
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
