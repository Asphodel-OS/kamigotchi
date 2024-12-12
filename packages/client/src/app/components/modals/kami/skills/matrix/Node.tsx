import styled, { keyframes } from 'styled-components';

import { Skill, getSkillInstance, parseBonusText } from 'app/cache/skill';
import { Tooltip } from 'app/components/library';
import { SkillImages } from 'assets/images/skills';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

interface Props {
  index: number;
  skill: Skill;
  kami: Kami;
  upgradeError: string[] | undefined;
  setDisplayed: () => void;
}

export const Node = (props: Props) => {
  const { index, skill, kami, upgradeError, setDisplayed } = props;
  if (skill == undefined) return <></>;

  const handleClick = () => {
    playClick();
    setDisplayed();
  };

  const imageKey = skill.name.toLowerCase().replaceAll(' ', '_') as keyof typeof SkillImages;
  const image = SkillImages[imageKey] ?? skill.image;
  const kSkill = getSkillInstance(kami, skill);

  const acquirable = upgradeError == undefined || upgradeError[0].startsWith('Maxed Out');

  const currPoints = kSkill?.points.current ?? 0;
  const maxPoints = skill.points.max;
  const cost = skill.cost;

  const name = skill.name;
  const description = skill.description ?? '';
  const bonus = skill.bonuses?.[0];
  const bonusText = bonus ? parseBonusText(bonus!) : '';

  const titleText = [`${name} (${cost})`, '', description, '', bonusText];

  return (
    <Tooltip text={titleText}>
      <Container key={index} onClick={handleClick} percent={currPoints / maxPoints}>
        <Image src={image} />
      </Container>
    </Tooltip>
  );
};

const Container = styled.div<{ percent: number }>`
  border: solid black 0.15vw;
  border-radius: 0.5vw;
  position: relative;
  overflow: hidden;

  width: 5vw;
  height: 5vw;
  padding: 0.1vw;

  align-items: center;
  justify-content: center;
  background-image: conic-gradient(gray ${({ percent }) => 360 * percent}deg, white 0);

  cursor: pointer;
  &:hover {
    animation: ${({}) => hover} 0.2s;
    transform: scale(1.05);
  }
  &:active {
    animation: ${({}) => click} 0.3s;
  }
`;

const Image = styled.img`
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  height: 100%;
  width: 100%;
  image-rendering: pixelated;
  pointer-events: auto;
`;

const hover = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
`;

const click = keyframes`
  0% { transform: scale(1.05); }
  50% { transform: scale(.95); }
  100% { transform: scale(1.05); }
`;
