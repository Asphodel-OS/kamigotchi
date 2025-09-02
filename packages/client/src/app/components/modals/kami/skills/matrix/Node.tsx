import styled, { keyframes } from 'styled-components';

import { Skill, getSkillInstance } from 'app/cache/skills';
import { TextTooltip } from 'app/components/library';
import { SkillImages } from 'assets/images/skills';
import { parseBonusText } from 'network/shapes/Bonus/interpretation';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

export const Node = ({
  index,
  skill,
  kami,
  upgradeError,
  setDisplayed,
}: {
  index: number;
  skill: Skill;
  kami: Kami;
  upgradeError: string[] | undefined;
  setDisplayed: () => void;
}) => {
  if (skill == undefined) return <></>;

  const handleClick = () => {
    playClick();
    setDisplayed();
  };

  const imageKey = skill.name.toLowerCase().replaceAll(' ', '_') as keyof typeof SkillImages;
  const image = SkillImages[imageKey] ?? skill.image;
  const instance = getSkillInstance(kami, skill.index);

  const acquirable = upgradeError == undefined || upgradeError[0].startsWith('Maxed Out');

  const getTooltip = () => {
    const description = skill.description ?? '';
    const bonus = skill.bonuses?.[0];
    const bonusDesc = parseBonusText(bonus!);
    return [description, '\n', bonusDesc];
  };

  const getPercentCompletion = () => {
    const currPoints = instance?.points ?? 0;
    const maxPoints = skill.max;
    return currPoints / maxPoints;
  };

  return (
    <TextTooltip title={skill.name} text={getTooltip()} maxWidth={24}>
      <Container key={index} onClick={handleClick} percent={getPercentCompletion()}>
        <Image src={image} />
      </Container>
    </TextTooltip>
  );
};

const Container = styled.div<{ percent: number }>`
  border: solid black 0.15em;
  border-radius: 0.5em;
  position: relative;
  overflow: hidden;

  width: 5em;
  height: 5em;
  padding: 0.1em;

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
  border: solid black 0.15em;
  border-radius: 0.4em;
  height: 100%;
  width: 100%;
  image-rendering: pixelated;
  pointer-events: auto;
  user-drag: none;
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
