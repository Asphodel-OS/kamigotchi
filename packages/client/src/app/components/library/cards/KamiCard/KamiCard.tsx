import { ReactNode, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { calcHealth } from 'app/cache/kami';
import { Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Bonus, parseBonusText } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { getItemImage } from 'network/shapes/utils/images';
import { playClick } from 'utils/sounds';
import { Card } from '../';
import { Cooldown } from './Cooldown';
import { Health } from './Health';

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current harvest or death as well as support common actions.
export const KamiCard = ({
  kami,
  content,
  description,
  descriptionOnClick,
  isFriend,
  contentTooltip,
  label,
  actions,
  showBattery,
  showLevelUp,
  showSkillPoints,
  showCooldown,
  utils: { calcExpRequirement, getTempBonuses } = {},
}: {
  kami: Kami; // assumed to have a harvest attached
  description: string[];
  descriptionOnClick?: () => void;
  contentTooltip?: string[];
  content: ReactNode;
  label?: {
    text: string;
    icon?: string;
    onClick?: () => void;
  };
  actions?: ReactNode;
  isFriend?: boolean;
  showBattery?: boolean;
  showLevelUp?: boolean;
  showSkillPoints?: boolean;
  showCooldown?: boolean;
  utils?: {
    calcExpRequirement?: (lvl: number) => number;
    getTempBonuses?: (kami: Kami) => Bonus[];
  };
}) => {
  const setModals = useVisibility((s) => s.setModals);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setKami = useSelected((s) => s.setKami);
  const kamiIndex = useSelected((s) => s.kamiIndex);
  const [canLevel, setCanLevel] = useState(false);

  // const { filter: cdFilter, foreground: cdForeground } = useCooldownVisuals(kami, showCooldown);

  /////////////////
  // INTERACTION

  // check if a kami can level up
  useEffect(() => {
    if (!kami.progress || !calcExpRequirement) return;
    const expCurr = kami.progress.experience;
    const expLimit = calcExpRequirement(kami.progress.level);
    setCanLevel(expCurr >= expLimit);
  }, [kami, calcExpRequirement]);

  // toggle the kami modal settings depending on its current state
  const handleKamiClick = () => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (kamiModalOpen && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  /////////////////
  // DISPLAY

  // generate the styled text divs for the description
  const Description = () => {
    const header = (
      <TextBig key='header' onClick={descriptionOnClick}>
        {description[0]}
      </TextBig>
    );

    const details = description
      .slice(1)
      .map((text, i) => <TextMedium key={`desc-${i}`}>{text}</TextMedium>);
    return <>{[header, ...details]}</>;
  };

  // get the list of item bonuses to display
  const itemBonuses = useMemo(() => {
    if (!getTempBonuses) return [];
    return getTempBonuses(kami).map((bonus) => ({
      image: getItemImage(bonus.source?.name || ''),
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
          showLevelUp: showLevelUp && canLevel,
          showSkillPoints: showSkillPoints && (kami.skills?.points ?? 0) > 0,
          // foreground: cdForeground,
          // background: undefined,
          // filter: cdFilter,
        },
      }}
    >
      <TitleBar>
        <TitleText key='title' onClick={() => handleKamiClick()}>
          {kami.name}
        </TitleText>
        <TitleCorner key='corner'>
          {showCooldown && <Cooldown kami={kami} />}
          {showBattery && (
            <Health current={calcHealth(kami)} total={kami.stats?.health.total ?? 0} />
          )}
        </TitleCorner>
      </TitleBar>
      <Content>
        <Top>
          <Column key='column-1'>
            <TextTooltip text={contentTooltip ?? []}>{content}</TextTooltip>
            {isFriend && <Friend>Friend</Friend>}
          </Column>
          {label && (
            <Column key='column-2'>
              <Label onClick={label.onClick}>
                <Text size={0.75}>{label.text}</Text>
                <LabelIcon src={label.icon} />
              </Label>
            </Column>
          )}
        </Top>
        <Bottom>
          {itemBonuses.length > 0 && (
            <Buffs>
              {itemBonuses.map((bonus, i) => (
                <TextTooltip key={i} text={[bonus.text]} direction='row'>
                  <Buff src={bonus.image} />
                </TextTooltip>
              ))}
            </Buffs>
          )}
          <Actions>{actions}</Actions>
        </Bottom>
      </Content>
    </Card>
  );
};

const TitleBar = styled.div`
  display: flex;

  border-bottom: solid black 0.15vw;
  padding: 0.45vw;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const TitleText = styled.div`
  display: flex;
  justify-content: flex-start;
  font-size: 1vw;
  text-align: left;
  cursor: pointer;
  &:hover {
    opacity: 0.6;
    text-decoration: underline;
  }
`;

const TitleCorner = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3vw;
  font-size: 1vw;
  text-align: right;
  height: 1.2vw;
`;

const Buffs = styled.div`
  display: flex;
  gap: 0.15vw;
  width: max-content;
  align-items: center;
  padding-bottom: 0.3vw;
  margin-left: 0.15vw;
`;

const Buff = styled.img`
  height: 1.2vw;
`;

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

const Bottom = styled.div`
  display: flex;
  position: relative;

  justify-content: space-between;
  align-items: flex-end;
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

const Actions = styled.div`
  display: flex;
  position: absolute;
  right: 0.1vw;
  bottom: 0.1vw;

  flex-flow: row nowrap;
  justify-content: flex-end;
  gap: 0.3vw;
`;

const TextBig = styled.p`
  padding: 0.2vw;

  font-size: 0.75vw;
  line-height: 0.9vw;
  text-align: left;

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

const TextMedium = styled.p`
  padding-left: 0.5vw;

  font-size: 0.6vw;
  line-height: 1vw;
  text-align: left;
`;

const Friend = styled.div`
  display: flex;
  width: 5vw;
  padding: 0.2vw;
  position: absolute;
  bottom: 0;
  background-color: rgb(192, 224, 139);
  color: rgb(25, 39, 2);
  clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%);

  align-items: center;
  justify-content: center;
  font-size: 0.6vw;
`;
