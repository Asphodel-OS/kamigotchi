import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { SkillNode } from './SkillNode';
import { SkillTrees } from 'constants/skills/trees';
import { Kami } from 'layers/network/shapes/Kami';
import { Skill } from 'layers/network/shapes/Skill';
import { ActionButton, Tooltip } from 'layers/react/components/library';


interface Props {
  kami: Kami;
  skills: Map<number, Skill>;
  setHovered: (skillIndex: number) => void;
  setSelected: (skillIndex: number) => void;
}

export const Matrix = (props: Props) => {
  const { kami, skills, setHovered, setSelected } = props;
  const [mode, setMode] = useState(SkillTrees.keys().next().value);
  const [nodeRects, setNodeRects] = useState(new Map<number, DOMRect>());

  useEffect(() => {
    setSelected(SkillTrees.get(mode)![0][0]);
  }, [mode]);


  return (
    <Container>
      <TopRow>
        <PointsText>{`Points: ${props.kami.skillPoints}`}</PointsText>
        <TreeButtons>
          {Array.from(SkillTrees.keys()).map((treeName) => (
            <Tooltip text={[`${treeName} tree`]} key={treeName}>
              <ActionButton
                id={treeName}
                text={treeName[0]}
                onClick={() => setMode(treeName)}
                disabled={mode === treeName}
              />
            </Tooltip>
          ))}
        </TreeButtons>
      </TopRow>
      <NodeMatrix>
        {SkillTrees.get(mode)!.map((row, i) => (
          <NodeRow key={i}>
            {row.map((index) => (
              <SkillNode
                key={index}
                kami={kami}
                skill={skills.get(index)!}
                nodeRects={nodeRects}
                setHovered={setHovered}
                setSelected={setSelected}
              />
            ))}
          </NodeRow>
        ))}
      </NodeMatrix>
    </Container>
  );
}


const Container = styled.div`
  position: relative;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;

const TopRow = styled.div`
  width: 100%;
  padding: 1vw .6vw;
  height: 3vw;
  background-color: #999;
  opacity: .6;
  position: absolute;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const PointsText = styled.div`
  padding: 1vw 1vw;

  color: black;
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
`;

const TreeButtons = styled.div`
  padding: 1vw .6vw;
  height: 3vw;
  color: black;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: .6vw;
`;

const NodeMatrix = styled.div`
  padding-top: 3vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: scroll;
`;

const NodeRow = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: 1.5vw;
`;