import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { MutualExclusivity, SkillTrees } from 'constants/skills/trees';
import { Kami } from 'layers/network/shapes/Kami';
import { Skill, getSkillInstance } from 'layers/network/shapes/Skill';
import { ActionButton, ItemIcon, Tooltip } from 'layers/react/components/library';

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
    setDisplayed(SkillTrees.get(mode)![0][0]); // set selected to root skill node
  }, [mode, skills.size]);

  const getNodes = () => {
    const tree = SkillTrees.get(mode)!;
    return tree.map((row, i) => getNodeRow(row, MutualExclusivity[i]));
  };

  const getNodeRow = (skillIndices: number[], exclusive: boolean[]) => {
    const skillRow = skillIndices.map((index) => Node(index));

    // fill in the rest of the row with empty nodes if skill outnumber exclusive info
    if (exclusive.length + 1 < skillIndices.length)
      exclusive.concat(Array(skillIndices.length - exclusive.length).fill(false));

    // create the row of lines; transparent if empty
    const lineRow = exclusive.map((isOn) => <Line style={{ opacity: isOn ? 1 : 0 }} />);

    // creating the final row
    const result: JSX.Element[] = [];
    for (let i = 0; i < exclusive.length; i++) {
      result.push(skillRow[i]);
      result.push(lineRow[i]);
    }
    result.push(skillRow[exclusive.length]);

    return <NodeRow>{result}</NodeRow>;
  };

  const Node = (skillIndex: number) => {
    const skill = skills.get(skillIndex);
    if (skill == undefined) return <></>;

    const upgradeError = utils.getSkillUpgradeError(skillIndex, kami, skills);
    const acquirable = upgradeError == undefined || upgradeError[0].startsWith('Maxed Out');

    const kSkill = getSkillInstance(kami, skill);
    const maxedOut = kSkill?.points.current === skill.points.max;
    const titleText = [`${skill.name} [${kSkill?.points.current ?? 0}/${skill.points.max}]`];

    return (
      <NodeWrapper style={{ opacity: acquirable ? '1' : '0.6' }}>
        <ItemIcon
          key={skillIndex}
          item={skill}
          size='small'
          onClick={() => setDisplayed(skillIndex)}
          hoverText={titleText}
          styleOverride={{
            box: { margin: '0', borderColor: `${maxedOut ? 'black' : '#444'}` },
            icon: { padding: '0' },
          }}
        />
      </NodeWrapper>
    );
  };

  return (
    <Container>
      <TopRow>
        <TreeButtons>
          {Array.from(SkillTrees.keys()).map((treeName) => (
            <Tooltip text={[`${treeName} tree`]} key={treeName}>
              <ActionButton
                text={mode === treeName ? treeName : treeName[0]}
                onClick={() => setMode(treeName)}
                disabled={mode === treeName}
              />
            </Tooltip>
          ))}
        </TreeButtons>
      </TopRow>
      <Content>
        {getNodes()}
        <PointsText style={{ position: 'absolute', bottom: '0.8vw', right: '0.8vw' }}>
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
  overflow-y: scroll;
`;

const Content = styled.div`
  padding-top: 3vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;

const TopRow = styled.div`
  width: 100%;
  padding: 1vw 0.6vw;
  height: 3vw;
  background-color: #999;
  position: absolute;
  opacity: 0.9;

  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: center;
  z-index: 1;
`;

const PointsText = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  background-color: #ffffff;
  padding: 0.6vw;
  opacity: 1;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
`;

const TreeButtons = styled.div`
  padding: 1vw 0.6vw;
  height: 3vw;
  color: black;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.6vw;
`;

const NodeRow = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: center;

  padding: 1.5vh;
  column-gap: 0.15vw;
`;

const NodeWrapper = styled.div``;

const Line = styled.hr`
  width: 2.5vw;
  align-self: center;
  border: solid black 0.075vw;
`;
