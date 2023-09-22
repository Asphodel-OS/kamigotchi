import styled from "styled-components";

import { Account } from "layers/react/shapes/Account";
import { Kami } from "layers/react/shapes/Kami";
import { Skill, Requirement, Status, checkCost, checkMaxxed, checkRequirement } from "layers/react/shapes/Skill";
import { ActionButton } from "../../library/ActionButton";
import { Tooltip } from "layers/react/components/library/Tooltip";


interface Props {
  skills: Skill[];
  holder: Account | Kami;
  actions: {
    upgrade: Function;
  }
}

interface TextBool {
  text: string;
  bool: boolean;
}

export const Matrix = (props: Props) => {
  const { skills, holder, actions } = props;

  ///////////////////
  // LOGIC

  const checkPrereqs = (skill: Skill): TextBool => {
    if (!checkMaxxed(skill, holder).completable)
      return {
        text: `At max level`,
        bool: false
      }

    if (!checkCost(skill, holder))
      return {
        text: `Insufficient skill points`,
        bool: false
      }

    for (const requirement of skill.requirements) {
      const status = checkRequirement(requirement, holder);
      if (!status.completable) {
        return {
          text: parseReqText(requirement, status),
          bool: false
        }
      }
    }

    return { text: '', bool: true };
  }


  ///////////////////////
  // DISPLAY

  const parseReqText = (req: Requirement, status: Status): string => {
    switch (req.type) {
      case 'LEVEL':
        return `Requires level ${status.target}`;
      case 'SKILL':
        // TODO: replace skill number with names
        return `Requires skill ${Number(req.index as number || 0)} at level ${status.target} [${status.current}/${status.target}]`;
      default:
        return '???';
    }
  }

  const ReqDisplay = (reqs: Requirement[]) => {
    if (reqs.length == 0) return <div />;
    return (
      <ConditionContainer key='reqs'>
        <ConditionName>Requirements</ConditionName>
        {reqs.map((req) => (
          <ConditionDescription key={req.id}>
            - {`${parseReqText(req, checkRequirement(req, holder))}`}
          </ConditionDescription>
        ))}
      </ConditionContainer>
    )
  }


  const DisplaySkills = () => {
    return skills.map((skill) => {
      const status = checkPrereqs(skill);
      const curSkill = holder.skills?.find((n) => n.index === skill.index);
      const curLevel = Number(curSkill?.level || 0);

      return (
        <SkillContainer key={skill.index}>
          <SkillName>{skill.name}</SkillName>
          <SkillDescription>{skill.description}</SkillDescription>
          <SkillDescription>{`Cost: ${skill.cost} point`}</SkillDescription>
          <SkillDescription>{`Level: ${curLevel}/${skill.max}`}</SkillDescription>
          {ReqDisplay(skill.requirements)}

          <Tooltip text={[status.text]}>
            <ActionButton
              id='upgrade'
              text={'upgrade'}
              disabled={!status.bool}
              onClick={() => actions.upgrade(holder.id, skill.index)}
            />
          </Tooltip>
        </SkillContainer>
      )
    })
  }



  // skills are basic entries with name, description, cost, requirements
  // a list view with all individual elements - this can be changed later
  return (
    <>
      {DisplaySkills()}
    </>
  );
}


const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
`;

const SkillContainer = styled.div`
  border-color: black;
  border-radius: 10px;
  border-style: solid;
  border-width: 2px;
  display: flex;
  justify-content: start;
  align-items: start;
  flex-direction: column;
  padding: 1vw;
  margin: 0.8vw;
`;

const SkillName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  color: #333;
  padding: 0.7vh 0vw;
`;

const SkillDescription = styled.div`
  color: #333;

  font-family: Pixel;
  text-align: left;
  line-height: 1.2vw;
  font-size: 0.7vw;
  padding: 0.4vh 0.5vw;
`;

const ConditionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 0.4vw 0.5vw;
`;

const ConditionName = styled.div`
  font-family: Pixel;
  font-size: 0.85vw;
  text-align: left;
  justify-content: flex-start;
  color: #333;
  padding: 0vw 0vw 0.3vw 0vw;
`;

const ConditionDescription = styled.div`
  color: #333;

  font-family: Pixel;
  text-align: left;
  font-size: 0.7vw;
  padding: 0.4vh 0.5vw;
`;