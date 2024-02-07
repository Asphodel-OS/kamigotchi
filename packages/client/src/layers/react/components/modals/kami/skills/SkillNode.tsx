import styled from "styled-components";

import { Kami } from "layers/network/shapes/Kami";
import {
  Skill,
  Requirement,
  meetsSkillCost,
  isSkillMaxxed,
  meetsSkillRequirement
} from "layers/network/shapes/Skill";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { playClick } from 'utils/sounds';


interface Props {
  skill: Skill;
  kami: Kami;
}

interface TextBool {
  text: string;
  bool: boolean;
}

export const SkillNode = (props: Props) => {
  const { skill, kami } = props;


  // ///////////////////
  // // LOGIC

  // const checkPrereqs = (skill: Skill): TextBool => {
  //   if (!isSkillMaxxed(skill, kami).isMet)
  //     return {
  //       text: `Max level reached!`,
  //       bool: false
  //     }

  //   if (!meetsSkillCost(skill, kami))
  //     return {
  //       text: `Insufficient skill points`,
  //       bool: false
  //     }

  //   for (const requirement of skill.requirements) {
  //     const status = meetsSkillRequirement(requirement, kami);
  //     if (!status.isMet) {
  //       return {
  //         text: 'Requirements not met',
  //         bool: false
  //       }
  //     }
  //   }

  //   return { text: '', bool: true };
  // }


  // /////////////////
  // // ACTIONS

  // const triggerUpgrade = (skill: Skill) => {
  //   playClick();
  //   // actions.upgrade(kami, skill);
  // }


  // /////////////////
  // // DISPLAY

  // const parseReqText = (req: Requirement, status: Status): string => {
  //   switch (req.type) {
  //     case 'LEVEL':
  //       return `• Kami Level ${status.target}`;
  //     // case 'SKILL':
  //     //   const skillName = skills.find((n) => n.index === req.index)?.name;
  //     //   return `• ${skillName} Level ${status.target} [${status.current}/${status.target}]`;
  //     default:
  //       return ' ???';
  //   }
  // }

  // const getReqs = (reqs: Requirement[]): string[] => {
  //   return reqs.map((req) => parseReqText(req, meetsSkillRequirement(req, kami)));
  // }

  // const getTooltipText = (skill: Skill): string[] => {
  //   const status = checkPrereqs(skill);

  //   let tooltipText = [skill.description, ''];
  //   tooltipText.push(`Cost: ${skill.cost} ${skill.cost > 1 ? "points" : "point"}`);

  //   const reqs = getReqs(skill.requirements);
  //   if (reqs.length > 0) {
  //     tooltipText.push('Requirements:');
  //     tooltipText.push(...reqs);
  //   }
  //   if (!status.bool) {
  //     tooltipText.push('');
  //     tooltipText.push(status.text);
  //   }
  //   return tooltipText;
  // }



  const curSkill = kami.skills?.find((n) => n.index === skill.index);
  const curLevel = Number(curSkill?.points.current || 0);


  return (
    <Tooltip text={[skill.name]} key={skill.index}>
      <Container
        key={skill.index}
        onClick={() => { () => { } }}
      >
        <Image src={skill.uri} />
      </Container>
      <Name>{skill.name}</Name>
      <Name>{`[${curLevel}/${skill.points.max}]`}</Name>
    </Tooltip>
  );
}


const Image = styled.img`
  border-radius: 1.5vw;
  width: 5vw;
`;

const Container = styled.button`
  border: solid black  .14vw;
  border-radius: 1vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  margin: 0.8vw;
  padding: 0.5vw;
  width: 6vw;
  height: 5vw;

  background-color: #fff;
  pointer-events: auto;
  &:hover {
    box-shadow: 0 0 11px rgba(33,33,33,.2);
    background-color: #ddd;
    cursor: pointer;
  }
  &:active {
    box-shadow: 0 0 16px rgba(11,11,11,.2); 
    background-color: #999;
    cursor: pointer;
  }
  &:disabled {
    background-color: #b2b2b2;
    cursor: default;
    pointer-events: none;
  }
`;

const Name = styled.div`
  font-family: Pixel;
  font-size: .7vw;
  text-align: center;
  justify-content: center;
  color: #333;
  padding: .4vw;
`;