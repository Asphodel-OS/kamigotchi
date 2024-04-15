import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { SkillTrees } from 'constants/skills/trees';
import { Kami } from 'layers/network/shapes/Kami';
import { Skill } from 'layers/network/shapes/Skill';
import { ActionButton, Tooltip } from 'layers/react/components/library';
import { Edge } from './Edge';
import { Node } from './Node';

interface Props {
  kami: Kami;
  skills: Map<number, Skill>;
  setHovered: (skillIndex: number) => void;
  setSelected: (skillIndex: number) => void;
}

export const Matrix = (props: Props) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { kami, skills, setHovered, setSelected } = props;
  const [mode, setMode] = useState(SkillTrees.keys().next().value);
  const [nodeRects, setNodeRects] = useState(new Map<number, DOMRect>());
  const [baseRect, setBaseRect] = useState<DOMRect>();
  const [edges, setEdges] = useState<number[][]>([]);

  useEffect(() => {
    // Function to update the bounding rectangle
    const updateRect = () => {
      if (contentRef.current) {
        const newRect = contentRef.current.getBoundingClientRect();
        setBaseRect(newRect);
      }
    };

    // Set up a resize observer to update the rectangle when the window resizes
    const resizeObserver = new ResizeObserver(updateRect);
    if (contentRef.current) resizeObserver.observe(contentRef.current);
    return () => {
      if (contentRef.current) resizeObserver.unobserve(contentRef.current);
    };
  }, []);

  // whenever the tree mode changes
  // - assign the root node of the tree as the selected Display skill
  // - update the web of dependencies used to draw edges
  useEffect(() => {
    const tree = SkillTrees.get(mode)!;
    const indexList = tree.flat(); // list of skill indices in this tree
    setSelected(indexList[0]); // set selected to root skill node

    let edges = [] as number[][];
    for (const index of indexList) {
      const skill = skills.get(index);
      if (!skill) continue;
      const dependencies = getNodeDependencies(skill);
      edges = edges.concat(dependencies.map((dep) => [dep, index]));
    }

    // no dependency data is available initially
    setEdges(edges);
  }, [mode, skills.size]);

  ////////////////////
  // INTERPRETATION

  // get the (skill node) dependencies of a skill node
  const getNodeDependencies = (skill: Skill) => {
    if (!skill.requirements) return [];
    const skillReqs = skill.requirements.filter((req) => req.type === 'SKILL');
    return skillReqs.map((req) => req.index! * 1);
  };

  return (
    <Container>
      <TopRow>
        <PointsText>{`Points: ${props.kami.skillPoints}`}</PointsText>
        <TreeButtons>
          {Array.from(SkillTrees.keys()).map((treeName) => (
            <Tooltip text={[`${treeName} tree`]} key={treeName}>
              <ActionButton
                text={treeName[0]}
                onClick={() => setMode(treeName)}
                disabled={mode === treeName}
              />
            </Tooltip>
          ))}
        </TreeButtons>
      </TopRow>
      <Content ref={contentRef}>
        {skills.size > 0 &&
          SkillTrees.get(mode)!.map((row, i) => (
            <NodeRow key={i}>
              {row.map((index) => (
                <Node
                  key={index}
                  kami={kami}
                  skill={skills.get(index)!}
                  nodeRects={nodeRects}
                  setNodeRects={setNodeRects}
                  setHovered={setHovered}
                  setSelected={setSelected}
                />
              ))}
            </NodeRow>
          ))}
        {edges.map((edge, i) => (
          <Edge key={i} from={edge[0]} to={edge[1]} baseRect={baseRect!} nodeRects={nodeRects} />
        ))}
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

const TopRow = styled.div`
  width: 100%;
  padding: 1vw 0.6vw;
  height: 3vw;
  background-color: #999;
  opacity: 0.9;
  position: absolute;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const PointsText = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  background-color: #ffffff;
  padding: 0.6vw;
  opacity: 1;

  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
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

const Content = styled.div`
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
