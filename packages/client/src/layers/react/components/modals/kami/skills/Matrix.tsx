import React from 'react';
import styled from 'styled-components';

import { Kami } from 'layers/network/shapes/Kami';
import { Skill } from 'layers/network/shapes/Skill';
import { SkillNode } from './SkillNode';

interface Props {
  kami: Kami;
  skills: Skill[];
  setHovered: (skillIndex: number) => void;
  setSelected: (skillIndex: number) => void;
}

export const Matrix = (props: Props) => {
  const { kami, skills, setHovered, setSelected } = props;

  return (
    <Container>
      <Text>{`Skill Points: ${props.kami.skillPoints}`}</Text>
      {skills.sort((a, b) => a.index - b.index)
        .map((skill) => (
          <SkillNode
            key={skill.index}
            kami={kami}
            skill={skill}
            setHovered={setHovered}
            setSelected={setSelected}
          />
        ))
      }
    </Container>
  );
}


const Container = styled.div`
  position: relative;

  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  overflow-y: scroll;
`;

const Text = styled.div`
  position: absolute;
  width: 100%;
  padding: 1vw 1vw;

  color: #333;
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
`;
