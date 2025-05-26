import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { StatDescriptions, StatIcons } from 'constants/stats';
import { Kami } from 'network/shapes/Kami';
import { Stat } from 'network/shapes/Stats';

interface Props {
  kami: Kami;
}

export const Stats = (Props: Props) => {
  const { kami } = Props;

  return (
    <Container>
      {/* <Title size={0.9}>Stats</Title> */}
      {Object.entries(kami.stats).map(([key, value]) => {
        if (key === 'stamina') return null;
        const description = StatDescriptions[key as keyof typeof StatDescriptions];
        const icon = StatIcons[key as keyof typeof StatIcons];
        const v = value as Stat;

        const total = v.base + v.shift;
        const tooltipText = [key, '', description];
        return (
          <TextTooltip key={key} text={tooltipText}>
            <Grouping>
              <Text size={0.75}>{total}</Text>
              <Icon size={1.3} src={icon} />
              {/* <Overlay right={0} translateX={100}>
                <Text size={0.5}>
                  ({v.base} + {v.shift})
                </Text>
              </Overlay> */}
            </Grouping>
          </TextTooltip>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  height: 80%;
  margin-left: 1.8vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-end;
  justify-content: flex-end;
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
