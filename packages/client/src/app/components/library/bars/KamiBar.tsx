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
import { Cooldown } from 'app/components/library/cards/KamiCard/Cooldown';
import { useSelected, useVisibility } from 'app/stores';
import { AffinityIcons } from 'constants/affinities';
import { HarvestingMoods, RestingMoods } from 'constants/kamis';
import { Bonus, parseBonusText } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { NullNode } from 'network/shapes/Node';
import { getRateDisplay } from 'utils/numbers';
import { playClick } from 'utils/sounds';
import { formatCountdown } from 'utils/time';

interface Props {
  kami: Kami;
  actions?: React.ReactNode;
  options?: {
    showCooldown?: boolean;
    showPercent?: boolean; // whether to show the percent health
    showTooltip?: boolean;
  };
  tick: number;

  // NOTE: this is really messy, we should embed temp bonuses onto the kami object
  utils: {
    getTempBonuses: (kami: Kami) => Bonus[];
  };
}

export const KamiBar = (props: Props) => {
  const { kami, actions, options, utils, tick } = props;
  const { showCooldown, showPercent, showTooltip } = options ?? {};
  const { kamiIndex, setKami } = useSelected();
  const { modals, setModals } = useVisibility();
  const [currentHealth, setCurrentHealth] = useState(0);

  useEffect(() => {
    setCurrentHealth(calcHealth(kami));
  }, [tick]);

  /////////////////
  // INTERACTION

  // toggle the kami modal settings depending on its current state
  const handleImageClick = () => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (modals.kami && sameKami) setModals({ kami: false });
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
    if (!showTooltip) return 100;
    const total = kami.stats?.health.total ?? 0;
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
    if (isResting(kami)) return '#9CBCD2';
    if (level <= 25) return '#BD4F6C';
    if (level <= 50) return '#F3752B';
    if (level <= 75) return '#F9DB6D';
    return '#16DB93';
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Left>
        <TextTooltip text={[`${kami.name}`]}>
          <Image src={kami.image} onClick={handleImageClick} />
        </TextTooltip>
        <TextTooltip
          text={[`Body: ${getKamiBodyAffinity(kami)}`, `Hand: ${getKamiHandAffinity(kami)}`]}
          direction='row'
        >
          <Icon src={getBodyIcon()} />
          <Icon src={getHandIcon()} />
        </TextTooltip>
      </Left>
      <Middle percent={calcHealthPercent()} color={getStatusColor(calcHealthPercent())}>
        <Overlay top={0.18} left={0.15} passthrough>
          <Text size={0.45}>{calcOutput(kami)}</Text>
        </Overlay>
        <TextTooltip text={getTooltip(kami)} direction='row'>
          <Text size={0.9}>{getKamiState(kami)}</Text>
          {showPercent && <Text size={0.75}>({calcHealthPercent().toFixed(0)}%)</Text>}
        </TextTooltip>
      </Middle>
      <Right>
        {showCooldown && <Cooldown kami={kami} />}
        {actions}
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
  margin: 0 0.3vw 0 0.3vw;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  flex-grow: 1;

  background: ${({ percent, color }) =>
    `linear-gradient(90deg, ${color}, 0%, ${color}, ${percent}%, #fff, ${Math.min(percent * 1.05, 100)}%, #fff 100%)`};
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

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  user-select: none;
  user-drag: none;
`;
