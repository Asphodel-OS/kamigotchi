import { useState } from 'react';
import styled from 'styled-components';

import { SkillImages } from 'assets/images/skills';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Condition } from 'network/shapes/Conditional';
import { Kami } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
import { Details } from './Details';
import { Matrix } from './matrix/Matrix';

export const Skills = ({
  data,
  actions,
  state,
  utils,
}: {
  data: {
    account: Account;
    kami: Kami;
    owner: BaseAccount;
  };
  actions: {
    upgrade: (skill: Skill) => void;
    reset: (kami: Kami) => void;
    onyxApprove: (price: number) => void;
    onyxRespec: (kami: Kami) => void;
  };
  state: { tick: number };
  utils: {
    getItemBalance: (index: number) => number;
    getSkill: (index: number) => Skill;
    getUpgradeError: (index: number) => string[] | undefined;
    getTreePoints: (tree: string) => number;
    getTreeRequirement: (skill: Skill) => number;
    parseSkillRequirement: (requirement: Condition) => string;
  };
}) => {
  const { kami } = data;
  const { tick } = state;
  const { getUpgradeError } = utils;
  const [displayed, setDisplayed] = useState(0); // index of displayed skill

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
        state={{ tick, skillIndex: displayed, upgradeError: getUpgradeError(displayed) }}
        actions={{ upgrade: actions.upgrade }}
        utils={{ ...utils, getSkillImage }}
      />
      <Matrix
        kami={kami}
        setDisplayed={(index: number) => setDisplayed(index)}
        actions={actions}
        utils={utils}
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
  user-select: none;
`;
