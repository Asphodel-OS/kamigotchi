import React, { useEffect } from 'react';
import styled from 'styled-components';

import { Kami } from 'layers/network/shapes/Kami';
import { Skill, parseEffectText, parseRequirementText } from 'layers/network/shapes/Skill';
import { ActionButton, HelpIcon, Tooltip } from 'layers/react/components/library';
import { meetsRequirement } from 'layers/network/shapes/Skill/functions';


interface Props {
  data: {
    kami: Kami;
    index: number; // index of the skill
    registry: Skill[]; // list of skills in the registry
  }
  actions: {
    upgrade: (skill: Skill) => void
  }
}


// TODO: button disabling / tooltip
export const Details = (props: Props) => {
  const { actions, data } = props;
  const [rSkill, setRSkill] = React.useState<Skill | undefined>(undefined);
  const [kSkill, setKSkill] = React.useState<Skill | undefined>(undefined);


  // update registry/kami skill instances when index changes
  useEffect(() => {
    setKSkill(data.kami.skills?.find((s) => s.index * 1 === data.index)); // kami skill instance
    setRSkill(data.registry.find((s) => s.index * 1 === data.index)); // registry skill instance
  }, [data.index, data.kami]);


  ////////////////////
  // INTERPRETATION

  // get the tooltip text for the upgrade button
  const getUpgradeButtonTooltip = () => {
    const disabledReason = getReasonForDisabled();
    if (disabledReason) return disabledReason;

    const cost = rSkill?.cost ?? 1;
    const currLevel = kSkill?.points.current ?? 0;
    const tooltipText = [
      `Upgrade Skill (${cost}pt${cost > 1 ? 's' : ''})`,
      '',
      `Level: ${currLevel} => ${(currLevel) + 1}`,
    ];

    return tooltipText;
  }


  // get the reason why a player cannot upgrade a skill
  // checking (in order) location/status, maxxed out, requirements unmet, not enough points
  // TODO: actually check for location instead of being lazy
  const getReasonForDisabled = () => {
    const kami = data.kami;
    if (kami.state !== 'RESTING') return [`${kami.name} must be Resting`];

    if (!rSkill) return [`Something went wrong.`, `Skill not found in registry`];

    const maxPoints = rSkill.points.max;
    if ((kSkill?.points.current ?? 0) >= maxPoints) return [`Maxxed Out (${maxPoints}/${maxPoints})`];

    // requirements
    for (let req of rSkill.requirements ?? []) {
      if (!meetsRequirement(req, kami)) return [
        `Unmet Requirement:`,
        `${parseRequirementText(req, data.registry)}`,
      ];
    }

    if (rSkill.cost > kami.skillPoints) return [
      `Insufficient Skill Points.`,
      `Need ${rSkill.cost}. Have ${kami.skillPoints}.`
    ];
  }


  ////////////////////
  // DISPLAY

  // render a list of values with a label (for Effects/Requirements)
  const LabeledList = (props: { label: string, values?: string[] }) => {
    if (!props.values || props.values.length <= 0) return <></>;
    return (
      <DetailSection>
        <DetailLabel>{props.label}:</DetailLabel>
        {props.values.map((value, i) => <DetailDescription key={i}>• {value}</DetailDescription>)}
      </DetailSection>
    );
  }


  ////////////////////
  // RENDER

  if (!rSkill) return <></>;
  return (
    <Container>
      <ImageSection>
        <Image src={rSkill.uri} />
        <div style={{ position: 'absolute', bottom: '.6vw', right: '.6vw' }}>
          <Tooltip text={getUpgradeButtonTooltip()}>
            <ActionButton
              id='upgrade'
              text={'Upgrade'}
              onClick={() => actions.upgrade(rSkill)}
              disabled={!!getReasonForDisabled()}
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
      </NameSection>

      <Description>
        {rSkill.description} blah blah blah this is a fuller description lorem ipsum falalala
      </Description>
      <LabeledList
        label='Effects'
        values={(rSkill.effects ?? []).map(
          (eff) => parseEffectText(eff)
        )}
      />
      <LabeledList
        label='Requirements'
        values={(rSkill.requirements ?? []).map(
          (req) => parseRequirementText(req, data.registry)
        )}
      />
    </Container>
  );
}


const Container = styled.div`
  border-right: .15vw solid #333;
  padding-bottom: 3vw;
  max-width: 18.9vw;
  min-width: 18.9vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;

const ImageSection = styled.div`
  border-bottom: .15vw solid #333;
  position: relative;

  display: flex;
  justify-content: center;
`;

const Image = styled.img`
  width: 100%;
`;

const NameSection = styled.div`
  border-bottom: .15vw solid #333;
  padding: 1vw .3vw;

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

const Description = styled.div`
  color: #666;
  padding: 1vw;

  display: flex;
  justify-content: center;
  line-height: 1.2vw;
  
  font-family: Pixel;
  font-size: .9vw;
`;

const DetailSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: .6vw 1vw;
`;

const DetailLabel = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: .9vw;
`;

const DetailDescription = styled.div`
  color: #999;
  font-family: Pixel;
  font-size: .6vw;
  line-height: 1.5vw;
  padding-left: .3vw;
`;
