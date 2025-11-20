import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Bonus, parseBonusText } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { getItemImage } from 'network/shapes/utils/images';
import { playClick } from 'utils/sounds';
import { Card } from '../';
import { TitleBar } from './titlebar/TitleBar';

export type LabelParams = {
  text: string;
  color?: string;
  icon?: string;
  onClick?: () => void;
};

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current harvest or death as well as support common actions.
export const KamiCard = ({
  kami,
  content,
  label,
  labelAlt,
  actions,
  show,
  tick,
  utils: { calcExpRequirement, getTempBonuses } = {},
}: {
  kami: Kami; // assumed to have a harvest attached
  actions?: ReactNode;
  content: ReactNode;
  label?: LabelParams;
  labelAlt?: LabelParams;
  show?: {
    battery?: boolean;
    cooldown?: boolean;
    levelUp?: boolean;
    skillPoints?: boolean;
  };
  utils?: {
    calcExpRequirement?: (lvl: number) => number;
    getTempBonuses?: (kami: Kami) => Bonus[];
  };
  tick: number;
}) => {
  const setModals = useVisibility((s) => s.setModals);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setKami = useSelected((s) => s.setKami);
  const kamiIndex = useSelected((s) => s.kamiIndex);

  const [canLevel, setCanLevel] = useState(false);
  const buffsRef = useRef<HTMLDivElement | null>(null);

  // const { filter: cdFilter, foreground: cdForeground } = useCooldownVisuals(kami, showCooldown);

  // check if a kami can level up
  useEffect(() => {
    if (!kami.progress || !calcExpRequirement) return;
    const expCurr = kami.progress.experience;
    const expLimit = calcExpRequirement(kami.progress.level);
    setCanLevel(expCurr >= expLimit);
  }, [kami.progress?.experience, calcExpRequirement]);

  /////////////////
  // INTERACTION

  // toggle the kami modal settings depending on its current state
  const handleKamiClick = () => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (kamiModalOpen && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  // horizontal scroll for buffs
  const handleWheel = (e: React.WheelEvent) => {
    if (!buffsRef.current) return;
    e.preventDefault();
    buffsRef.current.scrollLeft += e.deltaY;
  };

  /////////////////
  // DISPLAY

  // get the list of item bonuses to display
  const itemBonuses = useMemo(() => {
    if (!getTempBonuses) return [];
    return getTempBonuses(kami).map((bonus) => ({
      image: getItemImage(bonus.source?.name ?? ''),
      itemName: bonus.source?.name ?? '',
      text: parseBonusText(bonus),
    }));
  }, [getTempBonuses, kami]);

  /////////////////
  // RENDER

  return (
    <Card
      image={{
        icon: kami.image,
        onClick: handleKamiClick,
        effects: {
          showLevelUp: show?.levelUp && canLevel,
          showSkillPoints: show?.skillPoints && (kami.skills?.points ?? 0) > 0,
          foreground: itemBonuses.length > 0 && (
            <Buffs ref={buffsRef} onWheel={handleWheel}>
              {itemBonuses.map((bonus, i) => (
                <TextTooltip key={i} text={[bonus.text]} direction='row'>
                  <Buff src={bonus.image} />
                </TextTooltip>
              ))}
            </Buffs>
          ),
        },
      }}
    >
      <TitleBar kami={kami} onClick={handleKamiClick} show={show} tick={tick} />
      <Content>
        <Top>
          <Column key='column-1'>{content}</Column>
          <Column key='column-2'>
            {label && (
              <Label onClick={label.onClick}>
                <Text size={0.75}>{label.text}</Text>
                <LabelIcon src={label.icon} />
              </Label>
            )}
            {labelAlt && (
              <Label onClick={labelAlt.onClick}>
                <Text size={0.6} color={labelAlt.color}>
                  {labelAlt.text}
                </Text>
                <LabelIcon src={labelAlt.icon} />
              </Label>
            )}
          </Column>
        </Top>
        <Actions>{actions}</Actions>
      </Content>
    </Card>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
  padding: 0.2vw;
  user-select: none;
`;

const Top = styled.div`
  display: flex;
  flex-grow: 1;
`;

const Column = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex-grow: 1;
  position: relative;
  margin: 0.2vw;
  padding-top: 0.2vw;
`;

const Label = styled.div`
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-end;

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      opacity: 0.6;
      cursor: pointer;
      text-decoration: underline;
    }
  `}
`;

const LabelIcon = styled.img`
  height: 1.2vw;
  margin-bottom: 0.15vw;
`;

const Buffs = styled.div`
  background-color: rgba(255, 255, 255, 1);
  position: absolute;
  max-width: 95%;
  bottom: 0.15vw;
  left: 0.15vw;

  border: solid black 0.15vw;
  border-radius: 0.45vw;
  padding: 0.1vw;
  gap: 0.1vw;

  display: flex;
  flex-flow: row nowrap;

  pointer-events: auto;
  overflow: auto hidden;

  &::-webkit-scrollbar {
    height: 0.2vw;
  }
  &::-webkit-scrollbar-track {
    background-color: rgba(202, 202, 56, 1);
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(201, 150, 9, 1);
    border-radius: 0.2vw;
  }
`;

const Buff = styled.img`
  width: 1.3vw;
  height: 1.3vw;
  object-fit: cover;
`;

const Actions = styled.div`
  position: absolute;
  right: 0.15vw;
  bottom: 0.15vw;
  gap: 0.15vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
`;
