import styled from 'styled-components';

import { depressFx } from 'app/styles/effects';
import { TraitIcons } from 'assets/images/icons/traits';
import { AffinityColors } from 'constants/affinities';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

export const AffinityBlock = ({
  kami,
  traitKey,
}: {
  kami: Kami;
  traitKey: 'body' | 'hand';
}) => {
  const traits = kami.traits!;

  const icon = TraitIcons[traitKey as keyof typeof TraitIcons];
  const affinity = traits[traitKey as keyof typeof traits].affinity ?? 'normal';
  const affinityKey = affinity.toLowerCase();
  const color = AffinityColors[affinityKey as keyof typeof AffinityColors];

  return (
    <Container onMouseDown={playClick} color={color}>
      <Icon size={2.4} src={icon} />
      <Text size={1.4}>{affinityKey}</Text>
    </Container>
  );
};

const Container = styled.div<{ color?: string }>`
  position: relative;
  background-color: ${({ color }) => color ?? '#fff'};
  border: solid black 0.15em;
  border-radius: 1.2em;

  width: 12em;
  padding: 0.9em;
  gap: 0.6em;
  filter: drop-shadow(0.3em 0.3em 0.15em black);

  flex-grow: 1;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;

  cursor: pointer;
  user-select: none;
  &:active {
    animation: ${() => depressFx(0.1)} 0.2s;
  }
`;

// TODO: move to library
const Icon = styled.img<{ size: number }>`
  height: ${({ size }) => size}em;
  width: ${({ size }) => size}em;
  filter: drop-shadow(0 0 0.2em #bbb);
  user-drag: none;
`;

// TODO: generalize with library Text
const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}em;
  text-shadow: ${({ size }) => `0 0 ${size * 0.4}em white`};
  pointer-events: none;
`;
