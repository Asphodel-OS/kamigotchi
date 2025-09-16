import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { useSelected, useVisibility } from 'app/stores';
import { depressFx } from 'app/styles/effects';
import { StatColors, StatDescriptions, StatIcons } from 'constants/stats';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { AffinityBlock } from './AffinityBlock';
import { KamiImage } from './KamiImage';

const excludedStats = ['stamina', 'slots'];

export const Header = ({
  data,
  utils,
  actions,
}: {
  actions: {
    levelUp: (kami: Kami) => void;
  };
  data: {
    account: Account;
    owner: BaseAccount;
    kami: Kami;
  };
  utils: {
    calcExpRequirement: (level: number) => number;
  };
}) => {
  const { account, kami, owner } = data;
  const setAccount = useSelected((s) => s.setAccount);
  const setModals = useVisibility((s) => s.setModals);

  const isMine = () => {
    return owner.index == account.index;
  };

  const handleAccountClick = () => {
    if (isMine()) return;

    setAccount(owner.index || 0);
    setModals({
      account: true,
      kami: false,
      party: false,
      map: false,
    });
    playClick();
  };

  ///////////////////
  // DISPLAY

  return (
    <Container>
      <KamiImage data={data} actions={actions} utils={utils} />
      <Content>
        <Title size={2.4}>{kami.name}</Title>
        <Row>
          <AffinityContainer>
            <AffinityBlock kami={kami} traitKey='body' />
            <AffinityBlock kami={kami} traitKey='hand' />
          </AffinityContainer>
          <StatsContainer>
            {Object.entries(kami.stats ?? {})
              .filter(([key]) => !excludedStats.includes(key))
              .map(([name, value]) => {
                const description = StatDescriptions[name as keyof typeof StatDescriptions];
                const color = StatColors[name as keyof typeof StatColors];
                const icon = StatIcons[name as keyof typeof StatIcons];

                return (
                  <TextTooltip
                    key={name}
                    text={[`${name} (${value.base} + ${value.shift})`, '', description]}
                    grow
                  >
                    <StatPairing key={name} color={color} onMouseDown={playClick}>
                      <Icon size={2.1} src={icon} />
                      <Text size={1.1}>{value.total}</Text>
                    </StatPairing>
                  </TextTooltip>
                );
              })}
          </StatsContainer>
        </Row>
        <Overlay bottom={0.75} right={0.75}>
          <Footer onClick={handleAccountClick}>{isMine() ? 'yours' : owner.name}</Footer>
        </Overlay>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border-bottom: solid black 0.15rem;
  display: flex;
  flex-flow: row nowrap;
  user-select: none;
`;

const Content = styled.div`
  position: relative;
  height: 100%;
  padding: 0.75rem 0rem;

  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
`;

const Title = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}rem;
  padding: ${({ size }) => `${size * 0.75}rem ${size * 0.45}rem`};

  align-self: flex-start;
  user-select: none;
`;

const Row = styled.div`
  height: 10rem;
  gap: 0.9rem;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  justify-content: center;
`;

const AffinityContainer = styled.div`
  height: 100%;
  gap: 0.6rem;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
`;

const StatsContainer = styled.div`
  background-color: #999;
  border: solid black 0.15rem;
  border-radius: 1.2rem;
  filter: drop-shadow(0.3rem 0.3rem 0.15rem black);

  height: 100%;
  width: 19.3rem;
  padding: 0.6rem;
  gap: 0.6rem;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: stretch;
`;

const StatPairing = styled.div<{ color?: string }>`
  background-color: ${({ color }) => color ?? '#fff'};
  border: solid black 0.15rem;
  border-radius: 0.6rem;
  filter: drop-shadow(0.3rem 0.3rem 0.15rem black);

  padding: 0.75rem;
  gap: 0.45rem;
  min-width: 7.5rem;
  min-height: 4rem;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;

  user-select: none;
  pointer-events: auto;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    animation: ${() => depressFx(0.1)} 0.2s;
  }
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}rem;
  text-shadow: ${({ size }) => `0 0 ${size * 0.4}rem white`};
  pointer-events: none;
`;

const Icon = styled.img<{ size: number }>`
  height: ${({ size }) => size}rem;
  width: ${({ size }) => size}rem;
  filter: drop-shadow(0 0 0.2rem #bbb);
  user-drag: none;
`;

const Footer = styled.div`
  font-size: 0.6rem;
  text-align: right;
  color: #666;

  user-select: none;
  ${({ onClick }) => !onClick && 'pointer-events: none;'}
  &:hover {
    opacity: 0.6;
    cursor: pointer;
    text-decoration: underline;
  }
`;
