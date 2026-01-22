import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getHarvestItem } from 'app/cache/harvest';
import {
  calcHealth,
  calcOutput,
  getKamiBodyAffinity,
  getKamiHandAffinity,
  isDead,
  isHarvesting,
  isResting,
} from 'app/cache/kami';
import { calcHealTime, calcIdleTime, isOffWorld } from 'app/cache/kami/calcs/base';
import { Overlay, Text, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Shimmer } from 'app/styles/effects';
import { StatusIcons } from 'assets/images/icons/statuses';
import { AffinityIcons } from 'constants/affinities';
import { HarvestingMoods, RestingMoods } from 'constants/kamis';
import { HealthColors } from 'constants/kamis/health';
import { Bonus, parseBonusText } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { NullNode } from 'network/shapes/Node';
import { getRateDisplay } from 'utils/numbers';
import { playClick } from 'utils/sounds';
import { formatCountdown } from 'utils/time';
import { LevelUpArrows } from '../animations/LevelUp';
import { Cooldown } from './Cooldown';

export const KamiBar = ({
  kami,
  actions,
  options: { showCooldown, showLevelUp, showPercent, showTooltip, showSkillPoints } = {},
  utils,
  tick,
}: {
  kami: Kami;
  actions?:
    | React.ReactElement<{ cooldownBackground?: string }>
    | React.ReactElement<{ cooldownBackground?: string }>[];
  options?: {
    showCooldown?: boolean;
    showLevelUp?: boolean;
    showPercent?: boolean; // whether to show the percent health
    showTooltip?: boolean;
    showSkillPoints?: boolean;
  };
  tick: number;

  // NOTE: this is really messy, we should embed temp bonuses onto the kami object
  utils: {
    levelUp?: (kami: Kami) => void;
    calcExpRequirement?: (lvl: number) => number;
    getTempBonuses: (kami: Kami) => Bonus[];
  };
}) => {
  const kamiIndex = useSelected((s) => s.kamiIndex);
  const setKami = useSelected((s) => s.setKami);
  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setModals = useVisibility((s) => s.setModals);
  const [currentHealth, setCurrentHealth] = useState(0);
  const [canLevel, setCanLevel] = useState(false);

  useEffect(() => {
    setCurrentHealth(calcHealth(kami));
  }, [tick]);

  useEffect(() => {
    if (!kami.progress || !utils.calcExpRequirement) return;
    const expCurr = kami.progress.experience;
    const expLimit = utils.calcExpRequirement(kami.progress.level);
    setCanLevel(expCurr >= expLimit && isResting(kami));
  }, [kami.progress?.experience, kami.state, kami.progress?.level]);

  const getLevelUpTooltip = () => {
    if (!kami.progress || !utils.calcExpRequirement) return '';
    const expCurr = kami.progress.experience;
    const expLimit = utils.calcExpRequirement(kami.progress.level);
    if (expCurr < expLimit) return 'not enough exp';
    if (!isResting(kami)) return 'must be resting';
    return 'Level Up!';
  };

  const handleLevelUp = () => {
    if (canLevel && utils?.levelUp) {
      utils.levelUp(kami);
      playClick();
    }
  };

  /////////////////
  // INTERACTION

  // toggle the kami modal settings depending on its current state
  const handleImageClick = () => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (kamiModalOpen && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  /////////////////
  // INTERPRETATION

  const getBodyIcon = () => {
    const affinity = getKamiBodyAffinity(kami);
    const affinityKey = affinity.toLowerCase() as keyof typeof AffinityIcons;
    return AffinityIcons[affinityKey];
  };

  const getHandIcon = () => {
    const affinity = getKamiHandAffinity(kami);
    const affinityKey = affinity.toLowerCase() as keyof typeof AffinityIcons;
    return AffinityIcons[affinityKey];
  };

  // get the interpreted mood of the kami based on status
  const getMood = (kami: Kami, percent: number) => {
    let limit = 0;
    const limits = Object.keys(RestingMoods);
    for (let i = 0; i < limits.length; i++) {
      limit = Number(limits[i]);
      if (percent <= limit) {
        if (isHarvesting(kami)) return HarvestingMoods[limit];
        else if (isResting(kami)) return RestingMoods[limit];
      }
    }
  };

  // get the percent health the kami has remaining
  const calcHealthPercent = () => {
    if (isOffWorld(kami)) return 100;
    const total = kami.stats?.health.total ?? 0;
    if (total === 0) return 0;
    return (100 * currentHealth) / total;
  };

  // get the tooltip for the kami
  const getTooltip = (kami: Kami) => {
    // check for external and dead cases first to short circuit the tooltip
    if (isOffWorld(kami)) {
      return [`${kami.name} is not of this world`, `you may import them at the Scrap Confluence`];
    }
    if (isDead(kami)) {
      return [`There's blood on your hands.`, `${kami.name} has fallen..`];
    }

    // get general data for the tooltip
    // NOTE(ach): the underlying health calcs here are p inefficient ngl
    const totalHealth = kami.stats?.health.total ?? 0;
    const healthPercent = calcHealthPercent();
    const mood = getMood(kami, healthPercent);
    const duration = formatCountdown(calcIdleTime(kami));
    const healthRate = kami.stats!.health.rate;
    const healthRateStr = getRateDisplay(healthRate, 2);

    let tooltip: string[] = [
      `${kami.name} is ${mood}`,
      `HP: ${currentHealth}/${totalHealth} (${healthRateStr}/hr)`,
    ];

    // resting case
    if (isResting(kami)) {
      const healTime = calcHealTime(kami);
      if (healTime > 0) {
        const timeToFullStr = formatCountdown(healTime);
        tooltip = tooltip.concat([`${timeToFullStr} until full`]);
      }
    }

    // harvesting case
    if (isHarvesting(kami) && kami.harvest) {
      const harvest = kami.harvest;
      const spotRate = getRateDisplay(harvest.rates.total.spot, 2);
      const avgRate = getRateDisplay(harvest.rates.total.average, 2);
      const item = getHarvestItem(harvest);
      const node = harvest.node ?? NullNode;

      tooltip = tooltip.concat([
        `\n`,
        `Harvesting on ${node.name}`,
        `${calcOutput(kami)} ${item.name} (${spotRate}/hr) `,
        `[${avgRate}/hr avg]`,
      ]);
    }

    const bonuses = getBonusesDescription(kami);
    if (bonuses.length > 0) {
      tooltip = tooltip.concat([`\n`, `${bonuses.join('\n')}`]);
    }

    tooltip = tooltip.concat([`\n`, `${duration} since last action`]);

    return tooltip;
  };

  const showHealth = (kami: Kami) => {
    const totalHealth = kami.stats?.health.total ?? 0;
    const healthPercent = calcHealthPercent();

    return `${currentHealth}/${totalHealth} (${healthPercent.toFixed(0)}%)`;
  };
  // get the description of temp bonuses currently applied to the kami
  const getBonusesDescription = (kami: Kami) => {
    const bonuses = utils.getTempBonuses(kami);
    return bonuses.map((bonus) => parseBonusText(bonus));
  };

  const getKamiState = (kami: Kami) => {
    if (kami.state === '721_EXTERNAL') return 'WANDERING';
    else return kami.state;
  };

  // get the color of the kami's status bar
  const getStatusColor = (level: number) => {
    if (isResting(kami)) return HealthColors.resting;
    if (level <= 25) return HealthColors.dying;
    if (level <= 50) return HealthColors.vulnerable;
    if (level <= 75) return HealthColors.exposed;
    return HealthColors.healthy;
  };

  const getKamiStateIcon = (state: string) => {
    if (state === 'HARVESTING') return StatusIcons.kami_harvesting;
    if (state === 'RESTING') return StatusIcons.kami_resting;
    if (state === 'DEAD') return StatusIcons.kami_dead;
    if (state === 'WANDERING') return StatusIcons.kami_wandering;
  };

  const kamiState = getKamiState(kami);
  const healthPercent = calcHealthPercent();
  const statusColor = getStatusColor(healthPercent);
  const item = kami.harvest ? getHarvestItem(kami.harvest) : null;

  return (
    <Container>
      <Left>
        <TextTooltip text={[`${kami.name}`]}>
          <ImageWrapper>
            <Image src={kami.image} onClick={handleImageClick} />
            {showSkillPoints && (kami.skills?.points ?? 0) > 0 && (
              <Overlay top={0.2} right={0.2}>
                <Sp>SP</Sp>
              </Overlay>
            )}
          </ImageWrapper>
          {canLevel && showLevelUp && (
            <LevelUpButton>
              <LevelUpArrows />
              <Shimmer />
            </LevelUpButton>
          )}
        </TextTooltip>
        <TextTooltip
          text={[`Body: ${getKamiBodyAffinity(kami)}`, `Hand: ${getKamiHandAffinity(kami)}`]}
          direction='row'
        >
          <Icon src={getBodyIcon()} />
          <Icon src={getHandIcon()} />
        </TextTooltip>
      </Left>
      <Middle percent={healthPercent} color={statusColor}>
        <Overlay top={0.2} left={0.5}>
          <OutputSection>
            <Text size={0.6}>{calcOutput(kami)}</Text>
            {item && <OutputIcon src={item.image} />}
          </OutputSection>
        </Overlay>
        <TextTooltip text={getTooltip(kami)} direction='row'>
          <StateSection>
            <StateIcon src={getKamiStateIcon(kamiState)} />
            {showPercent && <Text size={0.7}>{showHealth(kami)}</Text>}
          </StateSection>
        </TextTooltip>
      </Middle>
      <Right>
        {actions && (showCooldown ? <Cooldown kami={kami}>{actions}</Cooldown> : actions)}
      </Right>
    </Container>
  );
};

const Container = styled.div`
  border: 0.15vw solid black;
  border-radius: 0.6vw;

  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;

  user-select: none;
`;

const Left = styled.div`
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const Right = styled.div`
  display: flex;
  position: relative;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.3vw;
  gap: 0.3vw;
`;

interface MiddleProps {
  percent: number;
  color: string;
}
const Middle = styled.div<MiddleProps>`
  position: relative;
  height: 3vw;

  border-right: solid black 0.15vw;
  border-left: solid black 0.15vw;
  margin: 0 0.2vw 0 0.2vw;
  padding: 0 0.2vw;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  flex-grow: 1;

  background: ${({ percent, color }) =>
    `linear-gradient(90deg, ${color}, 0%, ${color}, ${percent}%, #fff, ${Math.min(percent * 1.05, 100)}%, #fff 100%)`};
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 3vw;
  height: 3vw;
`;

const Image = styled.img`
  border-right: solid black 0.15vw;

  width: 3vw;
  height: 3vw;

  cursor: pointer;
  user-select: none;
  user-drag: none;
  &:hover {
    opacity: 0.8;
  }
`;

const Sp = styled.div`
  font-size: 0.85vw;
  font-weight: bold;
  background: linear-gradient(to right, #0b0d0eff, #ee0979);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  user-select: none;
  user-drag: none;
`;

const OutputSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: 0.4vw;
`;

const OutputIcon = styled.img`
  width: 1vw;
  height: 1vw;
`;

const StateIcon = styled.img`
  margin-right: 0.3vw;
  width: 2vw;
  height: 2vw;
`;

const StateSection = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const LevelUpButton = styled.div<{ disabled?: boolean }>`
  position: absolute;
  width: 3vw;
  height: 3vw;
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;

  pointer-events: none;
  overflow: hidden;

  &:hover {
    opacity: ${({ disabled }) => (disabled ? 1 : 0.8)};
  }
`;
