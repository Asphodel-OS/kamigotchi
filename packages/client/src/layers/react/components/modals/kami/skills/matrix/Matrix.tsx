import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { SkillTrees } from 'constants/skills/trees';
import { Kami } from 'layers/network/shapes/Kami';
import { Skill } from 'layers/network/shapes/Skill';
import { Menu } from './Menu';
import { Node } from './Node';

interface Props {
  kami: Kami;
  skills: Map<number, Skill>;
  setDisplayed: (skillIndex: number) => void;
  utils: {
    getSkillUpgradeError: (
      index: number,
      kami: Kami,
      registry: Map<number, Skill>
    ) => string[] | undefined;
  };
}

export const Matrix = (props: Props) => {
  const { kami, skills, setDisplayed, utils } = props;
  const [mode, setMode] = useState(SkillTrees.keys().next().value);

  // whenever the tree mode changes assign the skill at root node
  useEffect(() => {
    const rootNode = SkillTrees.get(mode)![0][0];
    setDisplayed(rootNode);
  }, [mode, skills.size]);

  return (
    <Container>
      <Menu options={Array.from(SkillTrees.keys())} mode={mode} setMode={setMode} />
      <Content>
        {SkillTrees.get(mode)!.map((row, i) => {
          return (
            <Row key={i}>
              <RowNumber>{i + 1}</RowNumber>
              {row.map((index) => (
                <Node
                  key={index}
                  index={index}
                  kami={kami}
                  skills={skills}
                  setDisplayed={() => setDisplayed(index)}
                  utils={utils}
                />
              ))}
            </Row>
          );
        })}
        <PointsText>
          {kami.skillPoints} unused point{kami.skillPoints != 1 ? 's' : ''}
        </PointsText>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const Content = styled.div`
  padding: 3vw 0vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;

const Row = styled.div`
  position: relative;
  padding: 1.2vw 3vw;

  display: flex;
  flex-flow: row;
  justify-content: space-evenly;
  align-items: center;

  &:hover {
    background-color: #ddd;
  }
`;

const RowNumber = styled.div`
  position: absolute;
  left: 2vw;

  color: black;
  font-family: Pixel;
  font-size: 1.2vw;
`;

const PointsText = styled.div`
  position: absolute;
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  background-color: #ffffff;
  bottom: 0.8vw;
  right: 0.8vw;
  padding: 0.6vw;
  opacity: 1;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
`;
