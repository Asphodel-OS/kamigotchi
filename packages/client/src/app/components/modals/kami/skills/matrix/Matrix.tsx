import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { SkillTrees, TierRequirements } from 'constants/skills/trees';
import { Kami } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
import { Menu } from './Menu';
import { Node } from './Node';

interface Props {
  kami: Kami;
  skills: Map<number, Skill>;
  setDisplayed: (skillIndex: number) => void;
  actions: {
    reset: (kami: Kami) => void;
  };
  utils: {
    getUpgradeError: (index: number) => string[] | undefined;
    getTreePoints: (tree: string) => number;
  };
}

// TODO: deprecate use of TierRequirements constant
export const Matrix = (props: Props) => {
  const { kami, skills, setDisplayed, actions, utils } = props;
  const [mode, setMode] = useState('Predator');

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
        <FloatBox>
          {kami.flags?.skillReset && (
            <ActionButton text='Reset' onClick={() => actions.reset(kami)} />
          )}
          <PointsText>
            {kami.skillPoints} point{kami.skillPoints != 1 ? 's' : ''}
          </PointsText>
        </FloatBox>
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

const FloatBox = styled.div`
  position: absolute;
  bottom: 0.8vw;
  right: 0.8vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  gap: 0.4vw;
`;

const PointsText = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.45vw;
  background-color: #ffffff;
  padding: 0.4vw 0.6vw;
  height: 2.1vw;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
`;
