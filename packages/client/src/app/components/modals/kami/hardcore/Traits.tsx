import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { TraitIcons } from 'assets/images/icons/traits';
import { Kami } from 'network/shapes/Kami';
import { Stat } from 'network/shapes/Stats';
import { Trait } from 'network/shapes/Trait';

export const Traits = ({
  kami,
}: {
  kami: Kami;
}) => {
  const traits = ['body', 'hand', 'face', 'color', 'background'];

  return (
    <Container>
      {/* <Title size={0.9}>Stats</Title> */}
      {traits.map((key) => {
        const trait = kami.traits![key as keyof typeof kami.traits] as Trait;
        const icon = TraitIcons[key as keyof typeof TraitIcons];
        const name = trait.name;
        const stats = trait.stats;

        const tooltipText = [
          `${key}: ${name}`,
          '',
          'lorem ipsum dolor sit amet consectetur adipisicing elit. fugiat, quis?',
        ];
        return (
          <Column>
            <TextTooltip key={key} text={tooltipText}>
              <Icon size={1.3} src={icon} />
            </TextTooltip>
            <Grouping>
              {Object.entries(stats).map(([key, stat]: [string, Stat]) => {
                if (key === 'stamina') return <></>;
                const base = stat.base;
                const statString = base > 0 ? base.toString() : '';
                return (
                  <Cell>
                    <Text size={0.75}>{statString}</Text>
                  </Cell>
                );
              })}
            </Grouping>
          </Column>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  height: 80%;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
`;

const Column = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`;

const Grouping = styled.div`
  position: relative;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: #ddd;
  }
`;

const Cell = styled.div`
  border-bottom: solid black 0.15vw;
  border-right: solid black 0.15vw;
  width: 1.9vw;
  height: 1.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
`;

const Title = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}vw;
  padding: ${({ size }) => `${size * 0.4}vw ${size * 0}vw`};
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}vw;
  margin: auto;
`;

const Icon = styled.img<{ size: number }>`
  height: ${({ size }) => size}vw;
  margin: 0 0.3vw;
`;
