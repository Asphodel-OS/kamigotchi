import styled from 'styled-components';

import { depressFx } from 'app/styles/effects';
import { TraitIcons } from 'assets/images/icons/traits';
import { AffinityColors } from 'constants/affinities';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

interface Props {
  kami: Kami;
  traitKey: 'body' | 'hand';
}

export const AffinityBlock = (props: Props) => {
  const { kami, traitKey } = props;
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
  border: solid black 0.15vw;
  border-radius: 1.2vw;

  width: 12vw;
  padding: 0.9vw;
  gap: 0.6vw;
  filter: drop-shadow(0.3vw 0.3vw 0.15vw black);

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
  height: ${(props) => props.size}vw;
  width: ${(props) => props.size}vw;
  filter: drop-shadow(0 0 0.2vw #bbb);
  user-drag: none;
`;

// TODO: generalize with library Text
const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.4}vw white`};
  pointer-events: none;
`;
