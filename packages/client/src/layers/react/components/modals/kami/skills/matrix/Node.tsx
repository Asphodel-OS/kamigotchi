import styled from 'styled-components';

import { skillImages } from 'assets/images/skills';
import { Kami } from 'layers/network/shapes/Kami';
import { Skill, getSkillInstance } from 'layers/network/shapes/Skill';
import { Tooltip } from 'layers/react/components/library';

interface Props {
  index: number;
  skills: Map<number, Skill>;
  kami: Kami;
  setDisplayed: () => void;
  utils: {
    getSkillUpgradeError: (
      index: number,
      kami: Kami,
      registry: Map<number, Skill>
    ) => string[] | undefined;
  };
}

export const Node = (props: Props) => {
  const { index, skills, kami, setDisplayed, utils } = props;
  const skill = skills.get(index);
  if (skill == undefined) return <></>;

  const upgradeError = utils.getSkillUpgradeError(index, kami, skills);
  const acquirable = upgradeError == undefined || upgradeError[0].startsWith('Maxed Out');

  const kSkill = getSkillInstance(kami, skill);
  const maxedOut = kSkill?.points.current === skill.points.max;
  const titleText = [`${skill.name} [${kSkill?.points.current ?? 0}/${skill.points.max}]`];
  const image = skillImages[skill.name.toLowerCase() as keyof typeof skillImages] ?? skill.image;
  return (
    <Tooltip text={titleText}>
      <Container key={index} onClick={setDisplayed} acquirable={acquirable}>
        <Image src={image} />
      </Container>
    </Tooltip>
  );
};

const Container = styled.div<{ acquirable: boolean }>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.5vw;

  width: 5vw;
  height: 5vw;
  margin: 0vw;

  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;

  opacity: ${({ acquirable }) => (acquirable ? '1' : '0.6')};
`;

const Image = styled.img`
  height: 100%;
  width: 100%;
  image-rendering: pixelated;
`;
