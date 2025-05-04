import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { calcHealth } from 'app/cache/kami';
import { Text } from 'app/components/library';
import { Cooldown } from 'app/components/library/cards/KamiCard/Cooldown';
import { useSelected, useVisibility } from 'app/stores';
import { AffinityIcons } from 'constants/affinities';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

/**
 * - amt
 * - rate?
 * - actions
 *
 */

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

  // toggle the kami modal settings depending on its current state
  const handleImageClick = () => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (modals.kami && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  const getBodyIcon = () => {
    const body = kami.traits?.body;
    if (!body || !body.affinity) return AffinityIcons.normal;
    const affinityKey = body.affinity.toLowerCase() as keyof typeof AffinityIcons;
    return AffinityIcons[affinityKey];
  };

  const getHandIcon = () => {
    const hand = kami.traits?.hand;
    if (!hand || !hand.affinity) return AffinityIcons.normal;
    const affinityKey = hand.affinity.toLowerCase() as keyof typeof AffinityIcons;
    return AffinityIcons[affinityKey];
  };

  const calcHealthPercent = () => {
    const total = kami.stats?.health.total ?? 0;
    return (100 * currentHealth) / total;
  };

  return (
    <Container percent={calcHealthPercent()} color={getHealthColor(calcHealthPercent())}>
      <Left>
        <Image src={kami.image} onClick={handleImageClick} />
        <Icon src={getBodyIcon()} />
        <Icon src={getHandIcon()} />
        <Text size={0.9}>{kami.state}</Text>
      </Left>
      <Actions>
        <Cooldown kami={kami} />
        {actions}
      </Actions>
    </Container>
  );
};
interface ContainerProps {
  percent: number;
  color: string;
}

const Container = styled.div<ContainerProps>`
  border: 0.15vw solid black;
  border-radius: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;

  background: ${({ percent, color }) =>
    `linear-gradient(90deg, ${color}, 0%, ${color}, ${percent * 0.95}%, #fff, ${Math.min(percent * 1.05, 100)}%, #fff 100%)`};
  user-select: none;
`;

const Left = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6vw;
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

const Image = styled.img`
  width: 3vw;
  height: 3vw;
  cursor: pointer;
  border-right: solid black 0.15vw;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

export const getHealthColor = (level: number) => {
  if (level <= 20) return '#FF6600';
  if (level <= 50) return '#FFD000';
  return '#23AD41';
};
