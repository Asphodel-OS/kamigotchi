import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { SkillImages } from 'assets/images/skills';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
import { Details } from './Details';
import { Matrix } from './matrix/Matrix';

interface Props {
  data: {
    account: Account;
    kami: Kami;
    owner: BaseAccount;
  };
  skills: Skill[]; // registry skills
  actions: {
    upgrade: (skill: Skill) => void;
    reset: (kami: Kami) => void;
  };
  utils: {
    getUpgradeError: (registry: Map<number, Skill>, index: number) => string[] | undefined;
    getTreePoints: (tree: string) => number;
    getTreeRequirement: (skill: Skill) => number;
  };
}

export const Skills = (props: Props) => {
  const { data, skills, actions, utils } = props;
  const { account, kami, owner } = data;
  const { getUpgradeError, getTreePoints, getTreeRequirement } = utils;

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
        data={data}
        index={displayed}
        skills={skillMap}
        actions={{ upgrade: actions.upgrade }}
        upgradeError={getUpgradeError(skillMap, displayed)}
        utils={{ ...utils, getSkillImage }}
      />
      <Matrix
        kami={kami}
        skills={skillMap}
        setDisplayed={(skillIndex) => setDisplayed(skillIndex)}
        actions={actions}
        utils={{
          getUpgradeError: (index: number) => getUpgradeError(skillMap, index),
          getTreePoints,
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
