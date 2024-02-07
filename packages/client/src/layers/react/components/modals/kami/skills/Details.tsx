import React from 'react';
import styled from 'styled-components';

import { Kami } from 'layers/network/shapes/Kami';
import { Skill } from 'layers/network/shapes/Skill';
import { ActionButton } from 'layers/react/components/library';

interface Props {
  data: {
    kami: Kami;
    skill: Skill;
  }
  actions: {
    upgrade: () => void
  }
}

export const Details = (props: Props) => {
  const { kami, skill } = props.data;

  const LabeledDetail = (props: { label: string, value: string }) => {
    return (
      <DetailRow>
        <DetailLabel>{props.label}:</DetailLabel>
        <DetailDescription>{props.value}</DetailDescription>
      </DetailRow>
    );
  }

  return (
    <Container>
      <ImageContainer>
        <Image src={skill.uri} />
        <div style={{ position: 'absolute', bottom: '.6vw', right: '.6vw' }}>
          <ActionButton
            id='upgrade'
            text={'Upgrade'}
            onClick={() => props.actions.upgrade()}
            disabled={false}
          />
        </div>
      </ImageContainer>
      <Name>{skill.name}</Name>
      <Description>
        {skill.description} blah blah blah this is a fuller description lorem ipsum falalala
      </Description>
      <LabeledDetail label='cost' value={`${skill.cost}pt`} />
      <LabeledDetail label='max' value={`${skill.max}pt`} />

    </Container>
  );
}


const Container = styled.div`
  border-right: 1px solid #333;
  height: 100%;

  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
`;

const Image = styled.img`
  width: 100%;
`;

const ImageContainer = styled.div`
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
  width: 100%;
  padding: 1vw;

  display: flex;
  justify-content: center;
  line-height: 1.2vw;
  
  font-family: Pixel;
  font-size: .9vw;
`;

const DetailRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: .6vw;
  padding: .6vw;
`;

const DetailLabel = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: .9vw;
`;

const DetailDescription = styled.div`
  color: #999;
  font-family: Pixel;
  font-size: .9vw;
`;
