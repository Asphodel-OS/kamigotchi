import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { calcHarvestAverageRate, getHarvestItem } from 'app/cache/harvest';
import { calcHealth, calcOutput, isDead, isHarvesting, isResting } from 'app/cache/kami';
import { Text, Tooltip } from 'app/components/library';
import { Cooldown } from 'app/components/library/cards/KamiCard/Cooldown';
import { useSelected, useVisibility } from 'app/stores';
import { AffinityIcons } from 'constants/affinities';
import { Kami } from 'network/shapes/Kami';
import { NullNode } from 'network/shapes/Node';
import { getRateDisplay } from 'utils/numbers';
import { playClick } from 'utils/sounds';
import { formatCountdown } from 'utils/time';
import { MoodLimits } from './constants';

interface Props {
  kami: Kami;
  actions?: React.ReactNode;
  tick: number;
}

export const KamiBar = (props: Props) => {
  const { kami, actions, tick } = props;
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
  // GETTERS

  const getBodyAffinity = () => {
    const body = kami.traits?.body;
    if (!body || !body.affinity) return 'NORMAL';
    return body.affinity;
  };

  const getHandAffinity = () => {
    const hand = kami.traits?.hand;
    if (!hand || !hand.affinity) return 'NORMAL';
    return hand.affinity;
  };

  const getBodyIcon = () => {
    const affinity = getBodyAffinity();
    const affinityKey = affinity.toLowerCase() as keyof typeof AffinityIcons;
    return AffinityIcons[affinityKey];
  };

  const getHandIcon = () => {
    const affinity = getHandAffinity();
    const affinityKey = affinity.toLowerCase() as keyof typeof AffinityIcons;
    return AffinityIcons[affinityKey];
  };

  const getMood = (percent: number) => {
    let limit = 0;
    const limits = Object.keys(MoodLimits);
    for (let i = 0; i < limits.length; i++) {
      limit = Number(limits[i]);
      if (percent <= limit) return MoodLimits[limit];
    }
  };

  const calcHealthPercent = () => {
    const total = kami.stats?.health.total ?? 0;
    return (100 * currentHealth) / total;
  };

  const getTooltip = () => {
    if (isDead(kami)) {
      return [`There's blood on your hands.`, `${kami.name} has fallen..`];
    }

    // get general data for the tooltip
    const totalHealth = kami.stats?.health.total ?? 0;
    const healthRate = getRateDisplay(kami.stats!.health.rate, 2);
    const healthPercent = calcHealthPercent();
    const mood = getMood(healthPercent);
    const duration = formatCountdown(tick / 1000 - (kami.time?.last ?? 0));

    let tooltip: string[] = [
      `${kami.name} is ${mood}`,
      `\n`,
      `HP: ${currentHealth}/${totalHealth} (${healthRate}/hr)`,
      `${duration} since last action`,
    ];

    // if (isResting(kami)) return tooltip;

    if (isHarvesting(kami) && kami.harvest) {
      const harvest = kami.harvest;
      const spotRate = getRateDisplay(harvest.rates.total.spot, 2);
      const avgRate = getRateDisplay(calcHarvestAverageRate(harvest), 2);
      const item = getHarvestItem(harvest);
      const node = harvest.node ?? NullNode;

      tooltip = tooltip.concat([
        `\n`,
        `Harvesting on ${node.name}`,
        `${calcOutput(kami)} ${item.name} (${spotRate}/hr) `,
        `[${avgRate}/hr avg]`,
      ]);
    }

    return tooltip;
  };

  const getStatusColor = (level: number) => {
    if (isResting(kami)) return '#9CBCD2';
    if (level <= 20) return '#BD4F6C';
    if (level <= 50) return '#F9DB6D';
    return '#16DB93';
  };

  return (
    <Container>
      <Left>
        <Tooltip text={[`${kami.name}`]}>
          <Image src={kami.image} onClick={handleImageClick} />
        </Tooltip>
        <Tooltip
          text={[`Body: ${getBodyAffinity()}`, `Hand: ${getHandAffinity()}`]}
          direction='row'
        >
          <Icon src={getBodyIcon()} />
          <Icon src={getHandIcon()} />
        </Tooltip>
      </Left>
      <Middle percent={calcHealthPercent()} color={getStatusColor(calcHealthPercent())}>
        <Tooltip text={getTooltip()} direction='row'>
          <Text size={0.9}>{kami.state}</Text>
          <Text size={0.9}>({calcHealthPercent().toFixed(0)}%)</Text>
        </Tooltip>
      </Middle>
      <Actions>
        <Cooldown kami={kami} />
        {actions}
      </Actions>
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

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.3vw;
  gap: 0.3vw;
`;

const Column = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
`;

interface MiddleProps {
  percent: number;
  color: string;
}
const Middle = styled.div<MiddleProps>`
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
  width: 3vw;
  height: 3vw;
  cursor: pointer;
  border-right: solid black 0.15vw;
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
`;
