import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getSkillInstance } from 'app/cache/skills';
import { ActionButton, HelpChip, Tooltip } from 'app/components/library';
import { Account, BaseAccount } from 'network/shapes/Account';
import { parseBonusText } from 'network/shapes/Bonus';
import { Condition } from 'network/shapes/Conditional';
import { Kami } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
import { playClick } from 'utils/sounds';

interface Props {
  data: {
    account: Account;
    kami: Kami;
    owner: BaseAccount;
  };
  actions: { upgrade: (skill: Skill) => void };
  state: {
    skillIndex: number;
    tick: number;
    upgradeError: string[] | undefined;
  };
  utils: {
    getSkill: (index: number) => Skill;
    getSkillImage: (skill: Skill) => string;
    getTreePoints: (tree: string) => number;
    getTreeRequirement: (skill: Skill) => number;
    parseSkillRequirement: (requirement: Condition) => string;
  };
}

// The leftside details panel of the Skills tab of the Kami Modal
export const Details = (props: Props) => {
  const { actions, data, state, utils } = props;
  const { account, kami, owner } = data;
  const { skillIndex, tick, upgradeError } = state;
  const { getSkill, getSkillImage, parseSkillRequirement } = utils;
  const { getTreePoints, getTreeRequirement } = utils;
  const [skill, setSkill] = useState<Skill | undefined>(getSkill(skillIndex)); // registry skill instance
  const [investment, setInvestment] = useState<number>(0);
  const [disabledReason, setDisabledReason] = useState<string[] | undefined>(undefined);

  // update registry/kami skill instances when skillIndex changes
  useEffect(() => {
    const skill = getSkill(skillIndex);
    setSkill(skill);

    const investment = getSkillInstance(kami, skillIndex);
    setInvestment(investment?.points ?? 0);

    setDisabledReason(owner.index !== account.index ? ['not ur kami'] : upgradeError);
  }, [skillIndex, kami, tick]);

  ////////////////////
  // INTERACTION

  // trigger an upgrade of the skill
  const triggerUpgrade = (skill: Skill) => {
    playClick();
    actions.upgrade(skill);
  };

  ////////////////////
  // INTERPRETATION

  const parseTreeRequirementText = (skill: Skill): string => {
    if (skill.tier == 0) return '';
    const tree = skill.type;
    const invested = getTreePoints(skill.type);
    const min = getTreeRequirement(skill);

    let text = `Invest >${min} ${tree} points`;
    text += invested < min ? ` [${invested}/${min}]` : ` ✅`;
    return text;
  };

  // get the tooltip text for the upgrade button
  const getUpgradeButtonTooltip = () => {
    if (disabledReason) return disabledReason;

    const cost = skill?.cost ?? 1;
    const currLevel = investment;
    const tooltipText = [
      `Upgrade Skill (${cost}pt${cost > 1 ? 's' : ''})`,
      '',
      `Level: ${currLevel} => ${currLevel + 1}`,
    ];

    return tooltipText;
  };

  ////////////////////
  // DISPLAY

  // render a list of values with a label (for Bonuses/Requirements)
  const LabeledList = (props: { label: string; values?: string[] }) => {
    if (!props.values || props.values.length <= 0 || props.values[0] == '') return <></>;
    return (
      <DetailSection>
        <DetailLabel>{props.label}:</DetailLabel>
        {props.values.map((value, i) => (
          <DetailDescription key={i}>• {value}</DetailDescription>
        ))}
      </DetailSection>
    );
  };

  ////////////////////
  // RENDER

  if (!skill) return <></>;
  return (
    <Container>
      <ImageSection>
        <Image src={getSkillImage(skill)} />
        <div style={{ position: 'absolute', bottom: '.6vw', right: '.6vw' }}>
          <Tooltip text={getUpgradeButtonTooltip()}>
            <ActionButton
              text={'Upgrade'}
              onClick={() => triggerUpgrade(skill)}
              disabled={!!disabledReason}
            />
          </Tooltip>
        </div>
        <div style={{ position: 'absolute', top: '.6vw', right: '.6vw' }}>
          <HelpChip
            tooltip={[
              `Skill Index: ${skill.index}`,
              `Cost: ${skill.cost} Skill Point(s)`,
              `Max: Level ${skill.max}`,
            ]}
          />
        </div>
      </ImageSection>

      <NameSection>
        <Name>{skill.name}</Name>
        <LevelText>
          [{investment}/{skill.max}]
        </LevelText>
      </NameSection>

      <Description>{skill.description}</Description>

      <LabeledList
        label='Bonuses'
        values={(skill.bonuses ?? []).map((bonus) => parseBonusText(bonus) + ' per level')}
      />
      <LabeledList
        label='Requirements'
        values={[
          parseTreeRequirementText(skill),
          ...(skill.requirements ?? []).map((req) => parseSkillRequirement(req)),
        ]}
      />
    </Container>
  );
};

const Container = styled.div`
  border-right: 0.15vw solid #333;
  padding-bottom: 3vw;
  max-width: 20vw;
  min-width: 20vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: auto;
`;

const ImageSection = styled.div`
  border-bottom: 0.15vw solid #333;
  position: relative;

  display: flex;
  justify-content: center;
`;

const Image = styled.img`
  image-rendering: pixelated;
  width: 10vw;
  margin: 0.75vw;

  border: solid black 0.15vw;
  border-radius: 0.5vw;
  user-drag: none;
`;

const NameSection = styled.div`
  border-bottom: 0.15vw solid #333;
  padding: 1.4vh 0.3vw;

  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
`;

const Name = styled.div`
  color: #333;
  width: 100%;
  padding: 0vw 1.2vw;

  display: flex;
  flex-flow: row wrap;
  justify-content: center;

  font-family: Pixel;
  font-size: 1.2vw;
  line-height: 1.5vw;
`;

const LevelText = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: 0.6vw;
  width: 100%;
  text-align: center;
  padding: 0.5vh 0 0 0;
`;

const Description = styled.div`
  color: #666;
  padding: 1.2vh 1vw;
  font-family: Pixel;
  text-align: left;
  line-height: 1vw;
  font-size: 0.75vw;
`;

const DetailSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.8vh 1vw;
`;

const DetailLabel = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: 0.9vw;
  padding: 0.3vh 0;
`;

const DetailDescription = styled.div`
  color: #666;
  font-family: Pixel;
  font-size: 0.6vw;
  line-height: 1vw;
  padding: 0.3vh 0;
  padding-left: 0.3vw;
`;
