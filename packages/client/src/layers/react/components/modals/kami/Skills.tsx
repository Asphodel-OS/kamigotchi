import styled from "styled-components";

import { Kami } from "layers/react/shapes/Kami";
import { Skill, Requirement, Status, checkCost, checkMaxxed, checkRequirement } from "layers/react/shapes/Skill";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { skillIcons } from "assets/images/skills";
import exitIcon from "assets/images/icons/exit_native.png"


interface Props {
  skills: Skill[];
  kami: Kami;
  actions: {
    upgrade: Function;
  }
}

interface TextBool {
  text: string;
  bool: boolean;
}

export const Skills = (props: Props) => {
  const { skills, kami, actions } = props;

  ///////////////////
  // LOGIC

  const checkPrereqs = (skill: Skill): TextBool => {
    if (!checkMaxxed(skill, kami).completable)
      return {
        text: `Max level reached!`,
        bool: false
      }

    if (!checkCost(skill, kami))
      return {
        text: `Insufficient skill points`,
        bool: false
      }

    for (const requirement of skill.requirements) {
      const status = checkRequirement(requirement, kami);
      if (!status.completable) {
        return {
          text: 'Requirements not met',
          bool: false
        }
      }
    }

    return { text: '', bool: true };
  }


  /////////////////
  // DISPLAY

  const parseReqText = (req: Requirement, status: Status): string => {
    switch (req.type) {
      case 'LEVEL':
        return `• Kami Level ${status.target}`;
      case 'SKILL':
        const skillName = skills.find((n) => n.index === req.index)?.name;
        return `• ${skillName} Level ${status.target} [${status.current}/${status.target}]`;
      default:
        return ' ???';
    }
  }

  const getReqs = (reqs: Requirement[]): string[] => {
    return reqs.map((req) => parseReqText(req, checkRequirement(req, kami)));
  }

  // Q: should we convert to on chain image URIs?
  // TODO: instantiate a map instead..
  const getImage = (skill: Skill): any => {
    switch (skill.name.toUpperCase()) {
      case 'ACQUISITIVENESS':
        return skillIcons.acquisitiveness;
      case 'AGGRESSION':
        return skillIcons.aggression;
      case 'BANDIT':
        return skillIcons.bandit;
      case 'DEFENSIVENESS':
        return skillIcons.defensiveness;
      case 'DEGENERATE':
        return skillIcons.degenerate;
      case 'ENDURANCE':
        return skillIcons.endurance;
      case 'GREED':
        return skillIcons.greed;
      case 'LEVERAGE':
        return skillIcons.leverage;
      case 'LOOPING':
        return skillIcons.looping;
      case 'PATIENCE':
        return skillIcons.patience;
      case 'PREDATOR':
        return skillIcons.predator;
      case 'PROTECTOR':
        return skillIcons.protector;
      case 'SNIPER':
        return skillIcons.sniper;
      case 'SUNGLASSES OWNERSHIP':
        return skillIcons.sunglassesOwnership;
      case 'VIGOR':
        return skillIcons.vigor;
      case 'WARMONGER':
        return skillIcons.warmonger;
      case 'WORKOUT ROUTINE':
        return skillIcons.workoutRoutine;
      default:
        return exitIcon;
    }
  }

  const DisplaySkills = () => {
    return (
      <Wrapper>
        {skills.map((skill) => {
          const status = checkPrereqs(skill);
          const curSkill = kami.skills?.find((n) => n.index === skill.index);
          const curLevel = Number(curSkill?.level || 0);

          let tooltipText = [];
          const reqs = getReqs(skill.requirements);
          if (!status.bool) tooltipText.push(status.text);
          if (reqs.length > 0) {
            tooltipText.push('');
            tooltipText.push('Requirements:');
            tooltipText.push(...reqs);
          }

          return (
            <Tooltip text={tooltipText} key={skill.index}>
              <SkillContainer
                key={skill.index}
                onClick={() => { status.bool ? actions.upgrade(kami, skill.index) : () => { } }}
                disabled={!status.bool}
              >
                <Image src={getImage(skill)} />
                <SkillName>{skill.name}</SkillName>
                <SkillDescription>{skill.description}</SkillDescription>
                <SkillDescription>{`Level: [${curLevel}/${skill.max}]`}</SkillDescription>
                <SkillDescription>{`Cost: ${skill.cost} ${skill.cost > 1 ? "points" : "point"}`}</SkillDescription>
              </SkillContainer>
            </Tooltip>
          )
        })}
      </Wrapper>
    );
  }

  return (
    <>
      <Text>{`Skill Points: ${props.kami.skillPoints}`}</Text>
      {DisplaySkills()}
    </>
  );
}

const Wrapper = styled.div`
  display: inline-flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  padding: 0.5vw;
`;

const Image = styled.img`
  height: 10vw;
`;

const Text = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  color: #333;
  padding: 1vh 0vw;
`;

const SkillContainer = styled.button`
  border-color: black;
  border-radius: 10px;
  border-style: solid;
  border-width: 2px;

  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  padding: 1vw;
  margin: 0.8vw;
  width: 15vw;
  height: 15vw;

  background-color: #ffffff;
  pointer-events: auto;
  &:hover {
    box-shadow: 0 0 11px rgba(33,33,33,.2); 
  }
  &:active {
    box-shadow: 0 0 16px rgba(11,11,11,.2); 
  }
`;

const SkillName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  color: #333;
  padding: 1vh 0vw;
`;

const SkillDescription = styled.div`
  color: #333;

  font-family: Pixel;
  text-align: left;
  font-size: 0.7vw;
  padding: 0.1vw 0.5vw;
`;