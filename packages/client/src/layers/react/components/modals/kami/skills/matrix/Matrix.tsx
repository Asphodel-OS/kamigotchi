import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { SkillTrees, TierRequirements } from 'constants/skills/trees';
import { Kami } from 'layers/network/shapes/Kami';
import { Skill } from 'layers/network/shapes/Skill';
import { Tooltip } from 'layers/react/components/library';
import { Menu } from './Menu';
import { Node } from './Node';

interface Props {
  kami: Kami;
  skills: Map<number, Skill>;
  setDisplayed: (skillIndex: number) => void;
  utils: {
    getUpgradeError: (index: number) => string[] | undefined;
    getTreePoints: (tree: string) => number;
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
          const tier = i + 1;
          const tierRequirement = TierRequirements[tier];
          const locked = utils.getTreePoints(mode) < tierRequirement;
          return (
            <Row key={tier} locked={locked}>
              <RowPrefix>
                <Tooltip text={[`unlock with ${tierRequirement} points`, `in ${mode} tree`]}>
                  <RowNumber>{tier}</RowNumber>
                </Tooltip>
              </RowPrefix>
              {row.map((index) => (
                <Node
                  key={index}
                  index={index}
                  kami={kami}
                  skill={skills.get(index)!}
                  upgradeError={utils.getUpgradeError(index)}
                  setDisplayed={() => setDisplayed(index)}
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

const Row = styled.div<{ locked: boolean }>`
  position: relative;
  border-bottom: solid black 0.15vw;
  padding: 1.2vw 3vw;

  display: flex;
  flex-flow: row;
  justify-content: space-evenly;
  align-items: center;

  background-color: ${({ locked }) => (locked ? '#ddd' : '#fff')};
`;

const RowPrefix = styled.div`
  position: absolute;
  left: 2vw;
`;

const RowNumber = styled.div`
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
