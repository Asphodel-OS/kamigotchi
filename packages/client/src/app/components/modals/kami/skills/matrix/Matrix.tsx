import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { SkillTrees } from 'constants/skills/trees';
import { Kami } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
import { Footer } from './Footer';
import { Menu } from './Menu';
import { Node } from './Node';

interface Props {
  kami: Kami;
  setDisplayed: (skillIndex: number) => void;
  actions: {
    reset: (kami: Kami) => void;
    onyxApprove: (price: number) => void;
    onyxRespec: (kami: Kami) => void;
  };
  utils: {
    getItemBalance: (index: number) => number;
    getSkill: (index: number) => Skill;
    getUpgradeError: (index: number) => string[] | undefined;
    getTreePoints: (tree: string) => number;
  };
}

export const Matrix = (props: Props) => {
  const { kami, setDisplayed, actions, utils } = props;
  const { getTreePoints, getSkill } = utils;
  const [mode, setMode] = useState('Predator');
  const [tierMins, setTierMins] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  // whenever the tree mode changes assign the skill at root node
  useEffect(() => {
    const rootNode = SkillTrees.get(mode)![0][0];
    setDisplayed(rootNode);
  }, [mode]);

  useEffect(() => {
    setTierMins(kami.config?.general.skills ?? [0, 0, 0, 0, 0, 0, 0]);
  }, [kami.config?.general.skills]);

  ////////////////////
  // DISPLAY

  return (
    <Container>
      <Menu options={Array.from(SkillTrees.keys())} mode={mode} setMode={setMode} />
      <Content>
        {SkillTrees.get(mode)!.map((row, i) => (
          <Row key={i + 1} locked={getTreePoints(mode) < tierMins[i]}>
            <RowPrefix>
              <Tooltip text={[`unlock with ${tierMins[i]} points`, `in ${mode} tree`]}>
                <RowNumber>{i + 1}</RowNumber>
              </Tooltip>
            </RowPrefix>
            {row.map((index) => (
              <Node
                key={index}
                index={index}
                kami={kami}
                skill={getSkill(index)}
                upgradeError={utils.getUpgradeError(index)}
                setDisplayed={() => setDisplayed(index)}
              />
            ))}
          </Row>
        ))}
        <Footer kami={kami} actions={actions} utils={utils} />
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
  user-select: none;
`;

const Content = styled.div`
  padding: 3vw 0vw 3.9vw 0vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: auto;
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
