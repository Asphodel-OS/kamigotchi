import React from 'react';
import styled from 'styled-components';

import { Kami } from 'layers/network/shapes/Kami';
import { Skill, parseRequirementText } from 'layers/network/shapes/Skill';
import { ActionButton, Tooltip } from 'layers/react/components/library';
import { parseEffectText } from 'layers/network/shapes/Skill/functions';

interface Props {
  data: {
    kami: Kami;
    index: number; // index of the skill
    registry: Skill[]; // list of skills in the registry
  }
  actions: {
    upgrade: () => void
  }
}



// TODO: button disabling / tooltip
// TODO: info icon for max and cost details 
export const Details = (props: Props) => {
  const { kami, index, registry } = props.data;
  const kSkill = kami.skills?.find((s) => s.index === index); // kami skill instance
  const rSkill = registry.find((s) => s.index === index); // registry skill instance
  const currentLevel = kSkill?.points.current ?? 0;


  const getUpgradeButtonTooltip = () => {
    const tooltipText = [
      'Upgrade Skill',
      '',
      `Level ${currentLevel} => ${(currentLevel ?? 0) + 1}`
    ];
    return tooltipText;
  }


  const LabeledList = (props: { label: string, values?: string[] }) => {
    if (!props.values || props.values.length <= 0) return <></>;
    return (
      <DetailSection>
        <DetailLabel>{props.label}:</DetailLabel>
        {props.values.map((value, i) => <DetailDescription key={i}>• {value}</DetailDescription>)}
      </DetailSection>
    );
  }


  if (!rSkill) return <></>;
  return (
    <Container>
      <ImageContainer>
        <Image src={rSkill.uri} />
        <div style={{ position: 'absolute', bottom: '.6vw', right: '.6vw' }}>
          <Tooltip text={getUpgradeButtonTooltip()}>
            <ActionButton
              id='upgrade'
              text={'Upgrade'}
              onClick={() => props.actions.upgrade()}
              disabled={false}
            />
          </Tooltip>
        </div>
      </ImageContainer>

      <Name>{rSkill.name}</Name>
      <Description>
        {rSkill.description} blah blah blah this is a fuller description lorem ipsum falalala
      </Description>
      <LabeledList
        label='Requirements'
        values={(rSkill.requirements ?? []).map(
          (req) => parseRequirementText(req, registry)
        )}
      />
      <LabeledList
        label='Effects'
        values={(rSkill.effects ?? []).map(
          (eff) => parseEffectText(eff)
        )}
      />
    </Container>
  );
}


const Container = styled.div`
  border-right: .15vw solid #333;
  padding-bottom: 3vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;

const Image = styled.img`
  width: 100%;
`;

const ImageContainer = styled.div`
  border-bottom: .15vw solid #333;
  position: relative;
  width: 18.75vw;
  height: 18.75vw;

  display: flex;
  justify-content: center;
`;

const Name = styled.div`
  color: #333;
  width: 100%;
  padding: 1vw;

  display: flex;
  justify-content: center;
  
  font-family: Pixel;
  font-size: 1.2vw;
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
