import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { calcHealth } from 'app/cache/kami';
import { TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Bonus, parseBonusText } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { getItemImage } from 'network/shapes/utils/images';
import { playClick } from 'utils/sounds';
import { Card } from '../';
import { Cooldown } from './Cooldown';
import { Health } from './Health';
import { calcCooldown, calcCooldownRequirement, onCooldown } from 'app/cache/kami/calcs/base';
import { SteamShader } from 'app/components/shaders/SteamShader';
import { LightningShader } from 'app/components/shaders/LightningShader';
import { ShaderStack } from 'app/components/shaders/ShaderStack';
import { makeStaticLayer } from 'app/components/shaders/StaticShader';
import { CRTShader } from 'app/components/shaders/CRTShader';

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current harvest or death as well as support common actions.
export const KamiCard = ({
  kami,
  description,
  descriptionOnClick,
  isFriend,
  contentTooltip,
  subtext,
  subtextOnClick,
  actions,
  showBattery,
  showLevelUp,
  showSkillPoints,
  showCooldown,
  utils: {
    calcExpRequirement,
    getTempBonuses,
  } = {},
}: {
  kami: Kami; // assumed to have a harvest attached
  description: string[];
  descriptionOnClick?: () => void;
  isFriend?: boolean;
  contentTooltip?: string[];
  subtext?: string;
  subtextOnClick?: () => void;
  actions?: React.ReactNode;
  showBattery?: boolean;
  showLevelUp?: boolean;
  showSkillPoints?: boolean;
  showCooldown?: boolean;
  utils?: {
    calcExpRequirement?: (lvl: number) => number;
    getTempBonuses?: (kami: Kami) => Bonus[];
  };
}) => {
  const { modals, setModals } = useVisibility();
  const { kamiIndex, setKami } = useSelected();
  const [canLevel, setCanLevel] = useState(false);

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

    if (modals.kami && sameKami) setModals({ kami: false });
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
      .map((text, i) => (
        <TextMedium
          key={`desc-${i}`}
          onClick={text.toLowerCase().startsWith('on ') ? subtextOnClick : undefined}
        >
          {text}
        </TextMedium>
      ));
    return <>{[header, ...details]}</>;
  };

  const itemBonuses = useMemo(() => {
    if (!getTempBonuses) return [];
    return getTempBonuses(kami).map((bonus) => ({
      image: getItemImage(bonus.source?.name || ''),
      text: parseBonusText(bonus),
    }));
  }, [getTempBonuses, kami]);

  // compute cooldown progress
  const totalCooldown = calcCooldownRequirement(kami);
  const remaining = calcCooldown(kami);
  const progress = totalCooldown > 0 ? Math.min(1, Math.max(0, remaining / totalCooldown)) : 0;
  const shaped = Math.pow(progress, 1.25); // slightly eased fade

  // grayscale amount should go from 1 -> 0 over cooldown
  const grayAmount = shaped; // 1 at start, 0 at end

  // Drive periodic re-render while on cooldown so CSS filter progresses
  const isOnCooldown = onCooldown(kami);
  const [cooldownTick, setCooldownTick] = useState(0);
  useEffect(() => {
    if (!isOnCooldown) return;
    const id = setInterval(() => setCooldownTick((t) => (t + 1) % 1000000), 200);
    return () => clearInterval(id);
  }, [isOnCooldown]);

  // Final-second uniform static wipe (wait 0.5s, then 0.5s wipe)
  const lastSecond = remaining <= 1.0;
  const timeIntoLast = lastSecond ? Math.max(0, 1.0 - remaining) : 0;
  const wipeWait = 0.5;
  const wipeDur = 0.5;
  const wipeProgress = lastSecond ? Math.max(0, Math.min(1, (timeIntoLast - wipeWait) / wipeDur)) : 0;

  const TitleSection = (
    <TitleBar>
      <TitleText key='title' onClick={() => handleKamiClick()}>
        {kami.name}
      </TitleText>
      <TitleCorner key='corner'>
        {showCooldown && <Cooldown kami={kami} />}
        {showBattery && <Health current={calcHealth(kami)} total={kami.stats?.health.total ?? 0} />}
      </TitleCorner>
    </TitleBar>
  );

  return (
    <Card
      image={{
        icon: kami.image,
        showLevelUp: showLevelUp && canLevel,
        showSkillPoints: showSkillPoints && (kami.skills?.points ?? 0) > 0,
        onClick: handleKamiClick,
        filter:
          showCooldown && onCooldown(kami)
            ? (grayAmount > 0 ? `grayscale(${grayAmount}) contrast(1.05)` : undefined)
            : undefined,
        background: undefined,
        foreground:
          showCooldown && onCooldown(kami)
            ? (() => {
                // Static grain and wipe are updated per-frame via onBeforeFrame
                const staticLayer: any = makeStaticLayer({ brightness: 1.6, alpha: 0.96, vertical: true });
                staticLayer.onBeforeFrame = (uniforms: any) => {
                  const tot = calcCooldownRequirement(kami);
                  const rem = calcCooldown(kami);
                  const prog = tot > 0 ? Math.min(1, Math.max(0, rem / tot)) : 0;
                  const eased = Math.pow(prog, 1.25);
                  const alpha = 0.96 * eased;
                  if (uniforms.uAlpha) uniforms.uAlpha.value = alpha;
                };

                // Final-second uniform static wipe: wait 0.5s, then 0.5s fade
                const wipeLayer: any = makeStaticLayer({
                  brightness: 1.7,
                  alpha: 0.0,
                  vertical: true,
                  topFeather: 0.0,
                  maskRadius: 0.0,
                  maskHeight: 0.0,
                });
                wipeLayer.onBeforeFrame = (uniforms: any) => {
                  const tot = calcCooldownRequirement(kami);
                  const rem = calcCooldown(kami);
                  const lastSecond = rem <= 1.0 && rem > 0; // only show while > 0 and <= 1s
                  if (!lastSecond) {
                    if (uniforms.uAlpha) uniforms.uAlpha.value = 0.0;
                    return;
                  }
                  const timeIntoLast = Math.max(0, 1.0 - rem);
                  const wait = 0.5;
                  const dur = 0.5;
                  const wp = Math.max(0, Math.min(1, (timeIntoLast - wait) / dur));
                  const a = 0.9 * (1 - wp);
                  if (uniforms.uTopSplit) uniforms.uTopSplit.value = 2.0; // uniform
                  if (uniforms.uAlpha) uniforms.uAlpha.value = a;
                };

                return (
                  <>
                    {/* Subtle CRT layer remains constant */}
                    <CRTShader brightness={1.6} alpha={0.96} />
                    {/* Static grain fades over full cooldown */}
                    <ShaderStack layers={[staticLayer]} animateWhenOffscreen />
                    {/* Final-second wipe */}
                    <ShaderStack layers={[wipeLayer]} animateWhenOffscreen />
                  </>
                );
              })()
            : undefined,
      }}
    >
      {TitleSection}
      <Content>
        <ContentRow>
          <ContentColumn key='column-1'>
            <TextTooltip text={contentTooltip ?? []}>
              <Description />
            </TextTooltip>
            {isFriend && <Friend>Friend</Friend>}
          </ContentColumn>
          <ContentColumn key='column-2'>
            {subtext ? (
              <ContentSubtext onClick={subtextOnClick}>{subtext}</ContentSubtext>
            ) : null}
          </ContentColumn>
        </ContentRow>
        <ContentBottom>
          {itemBonuses.length > 0 && (
            <Buffs>
              {itemBonuses.map((bonus, i) => (
                <TextTooltip key={i} text={[bonus.text]} direction='row'>
                  <Buff src={bonus.image} />
                </TextTooltip>
              ))}
            </Buffs>
          )}
          <ContentActions>{actions}</ContentActions>
        </ContentBottom>
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
  gap: 0.2vw;
  width: max-content;
  align-items: center;
  padding: 0.2vw;
  margin: 0 0 0 0.4vw;
`;

const Buff = styled.img`
  height: 1.6vw;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
  padding: 0.2vw;
  user-select: none;
`;

const ContentRow = styled.div`
  display: flex;
  flex-grow: 1;
`;

const ContentBottom = styled.div`
  display: flex;
  position: relative;

  justify-content: space-between;
  align-items: flex-end;
`;

const ContentColumn = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex-grow: 1;
  position: relative;
  margin: 0.2vw;
  padding-top: 0.2vw;
`;

const ContentSubtext = styled.div`
  flex-grow: 1;
  text-align: right;
  font-size: 0.7vw;

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

const ContentActions = styled.div`
  display: flex;
  position: absolute;
  right: 0.2vw;
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

  ${({ onClick }) =>
    onClick &&
    `
    color: #2b6cb0;
    cursor: pointer;
    &:hover {
      opacity: 0.7;
      text-decoration: underline;
    }
  `}
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
