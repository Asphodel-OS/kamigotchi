import styled from 'styled-components';

import { Tooltip } from 'app/components/library';

import { TraitIcons } from 'assets/images/icons/traits';
import { Kami } from 'network/shapes/Kami';
import { Trait } from 'network/shapes/Trait';

interface Props {
  kami: Kami;
}

export const Traits = (Props: Props) => {
  const { kami } = Props;

  return (
    <Container>
      {/* <Title size={0.9}>Stats</Title> */}
      {Object.entries(kami.traits!).map(([key, value]) => {
        const icon = TraitIcons[key as keyof typeof TraitIcons];
        const trait = value as Trait;
        const name = trait.name;

        const tooltipText = [key, '', name];
        return (
          <Tooltip key={key} text={tooltipText}>
            <Grouping>
              <Text size={0.75}>{name}</Text>
              <Icon size={1.3} src={icon} />
            </Grouping>
          </Tooltip>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  height: 70%;
  margin-left: 7vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-end;
  justify-content: flex-start;
`;

const Grouping = styled.div`
  position: relative;
  border-radius: 0.3vw;
  padding: 0.3vw 0.45vw;
  gap: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  &:hover {
    background-color: #ddd;
  }
`;

const Title = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}vw;
  padding: ${({ size }) => `${size * 0.4}vw ${size * 0}vw`};
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  margin: auto;
`;

const Icon = styled.img<{ size: number }>`
  height: ${({ size }) => size}vw;
`;
