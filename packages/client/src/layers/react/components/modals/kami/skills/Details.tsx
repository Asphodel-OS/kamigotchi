import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'layers/network/shapes/Account';
import { Kami } from 'layers/network/shapes/Kami';
import {
  Skill,
  parseEffectText,
  parseRequirementText,
  parseTreeRequirementText,
} from 'layers/network/shapes/Skill';
import { ActionButton, HelpIcon, Tooltip } from 'layers/react/components/library';

interface Props {
  data: {
    account: Account;
    kami: Kami;
    skills: Map<number, Skill>; // Map of Skills in the registry (by index)
    index: number; // index of the displayed skill
  };
  actions: {
    upgrade: (skill: Skill) => void;
  };
  utils: {
    getSkillUpgradeError: (
      index: number,
      kami: Kami,
      registry: Map<number, Skill>
    ) => string[] | undefined;
    getTreePoints: (target: Kami, tree: string) => number;
  };
}

// The leftside details panel of the Skills tab of the Kami Modal
export const Details = (props: Props) => {
  const { actions, data, utils } = props;
  const [rSkill, setRSkill] = useState<Skill | undefined>(undefined);
  const [kSkill, setKSkill] = useState<Skill | undefined>(undefined);
  const [disabledReason, setDisabledReason] = useState<string[] | undefined>(undefined);

  // update registry/kami skill instances when index changes
  useEffect(() => {
    setRSkill(data.skills.get(data.index)); // registry skill instance
    setKSkill(data.kami.skills?.find((s) => s.index * 1 === data.index)); // kami skill instance
    setDisabledReason(
      data.kami.account?.index !== data.account.index
        ? ['not ur kami']
        : utils.getSkillUpgradeError(data.index, data.kami, data.skills)
    );
  }, [data.index, data.kami]);

  ////////////////////
  // INTERPRETATION

  // get the tooltip text for the upgrade button
  const getUpgradeButtonTooltip = () => {
    if (disabledReason) return disabledReason;

    const cost = rSkill?.cost ?? 1;
    const currLevel = kSkill?.points.current ?? 0;
    const tooltipText = [
      `Upgrade Skill (${cost}pt${cost > 1 ? 's' : ''})`,
      '',
      `Level: ${currLevel} => ${currLevel + 1}`,
    ];

    return tooltipText;
  };

  ////////////////////
  // DISPLAY

  // render a list of values with a label (for Effects/Requirements)
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

  if (!rSkill) return <></>;
  return (
    <Container>
      <ImageSection>
        <Image src={rSkill.image} />
        <div style={{ position: 'absolute', bottom: '.6vw', right: '.6vw' }}>
          <Tooltip text={getUpgradeButtonTooltip()}>
            <ActionButton
              text={'Upgrade'}
              onClick={() => actions.upgrade(rSkill)}
              disabled={!!disabledReason}
            />
          </Tooltip>
        </div>
        <div style={{ position: 'absolute', top: '.6vw', right: '.6vw' }}>
          <HelpIcon
            tooltip={[
              `Skill Index: ${data.index}`,
              `Cost: ${rSkill.cost} Skill Point(s)`,
              `Max: Level ${rSkill.points.max}`,
            ]}
          />
        </div>
      </ImageSection>

      <NameSection>
        <Name>{rSkill.name}</Name>
        <LevelText>
          [{kSkill?.points.current ?? 0}/{rSkill.points.max}]
        </LevelText>
      </NameSection>

      <Description>{rSkill.description}</Description>

      <LabeledList
        label='Effects'
        values={(rSkill.effects ?? []).map((eff) => parseEffectText(eff))}
      />
      <LabeledList
        label='Requirements'
        values={[
          parseTreeRequirementText(rSkill, utils.getTreePoints(data.kami, rSkill.tree)),
          ...(rSkill.requirements ?? []).map((req) => parseRequirementText(req, data.skills)),
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
  overflow-y: scroll;
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
