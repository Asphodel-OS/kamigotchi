import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getSkillInstance } from 'app/cache/skills';
import { ActionButton, HelpChip, TextTooltip } from 'app/components/library';
import { Account, BaseAccount } from 'network/shapes/Account';
import { parseBonusText } from 'network/shapes/Bonus';
import { Condition } from 'network/shapes/Conditional';
import { Kami } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
import { playClick } from 'utils/sounds';

// The leftside details panel of the Skills tab of the Kami Modal
export const Details = ({
  actions,
  data,
  state,
  utils,
}: {
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
}) => {
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
  const LabeledList = ({ label, values }: { label: string; values?: string[] }) => {
    if (!values || values.length <= 0 || values[0] == '') return <></>;
    return (
      <DetailSection>
        <DetailLabel>{label}:</DetailLabel>
        {values.map((value, i) => (
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
        <div style={{ position: 'absolute', bottom: '.6em', right: '.6em' }}>
          <TextTooltip text={getUpgradeButtonTooltip()}>
            <ActionButton
              text={'Upgrade'}
              onClick={() => triggerUpgrade(skill)}
              disabled={!!disabledReason}
            />
          </TextTooltip>
        </div>
        <div style={{ position: 'absolute', top: '.6em', right: '.6em' }}>
          <HelpChip
            tooltip={{
              text: [
                `Skill Index: ${skill.index}`,
                `Cost: ${skill.cost} Skill Point(s)`,
                `Max: Level ${skill.max}`,
              ],
            }}
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
  border-right: 0.15em solid #333;
  padding-right: 1em;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  position: sticky;
  background: #f5f5f5;
  height: 100%;
  z-index: 1;
  width: 50%;
`;

const ImageSection = styled.div`
  border-bottom: 0.15em solid #333;
  position: relative;

  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
`;

const Image = styled.img`
  image-rendering: pixelated;
  width: 7em;
  margin: 0.75em;

  border: solid black 0.15em;
  border-radius: 0.5em;
  user-drag: none;
`;

const NameSection = styled.div`
  padding: 1em 0.3em;

  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  border-bottom: 0.15em solid #333;
  width: 100%;
  min-width: 0;
  overflow-wrap: break-word;
`;

const Name = styled.div`
  color: #333;
  width: 100%;
  padding: 0em 0.2em;
  text-align: center;
  font-size: 1em;
  line-height: 1.5em;
`;

const LevelText = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: 0.6em;
  width: 100%;
  text-align: center;
  padding: 0.5em 0 0 0;
`;

const Description = styled.div`
  color: #666;
  padding: 1.2em 0.5em;
  text-align: justify;
  line-height: 1em;
  font-size: 1em;
  border-bottom: 0.15em solid #333;
  width: 100%;
  min-width: 0;
  overflow-wrap: break-word;
  overflow-y: auto;
`;

const DetailSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.8em 1em;
  width: 100%;
  min-width: 0;
  overflow-wrap: break-word;
`;

const DetailLabel = styled.div`
  color: #333;

  font-size: 0.9em;
  padding: 0.3em 0;
`;

const DetailDescription = styled.div`
  color: #666;

  font-size: 0.8em;
  line-height: 1em;
  padding: 0.3em 0;
  padding-left: 0.3em;
`;
