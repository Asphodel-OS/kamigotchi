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
      <Content>
        <Title size={2}>{kami.name}</Title>
        <Row>
          <KamiImage data={data} actions={actions} utils={utils} />
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
        <Overlay bottom={0} right={0.75}>
          <Footer onClick={handleAccountClick}>{isMine() ? 'yours' : owner.name}</Footer>
        </Overlay>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border-bottom: solid black 0.15em;
  display: flex;
  flex-flow: row nowrap;
  user-select: none;
`;

const Content = styled.div`
  position: relative;
  height: 100%;
  padding: 0.75em 0.5em;

  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  pointer-events: none;
`;

const Title = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}em;
  user-select: none;
`;

const Row = styled.div`
  height: 25cqmin;
  gap: 0.9em;
  width: 95cqi;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  justify-content: flex-start;
  margin-bottom: 0.6em;
  align-items: center;
`;

const AffinityContainer = styled.div`
  gap: 0.6em;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  font-size: min(2cqi, 0.8em);
`;

const StatsContainer = styled.div`
  background-color: #999;
  border: solid black 0.15em;
  border-radius: 1.2em;
  filter: drop-shadow(0.1em 0.1em 0.15em black);

  width: 19.3em;
  padding: 0.6em;
  gap: 0.6em;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: stretch;
  font-size: min(2cqi, 0.8em);
`;

const StatPairing = styled.div<{ color?: string }>`
  background-color: ${({ color }) => color ?? '#fff'};
  border: solid black 0.15em;
  border-radius: 0.6em;
  filter: drop-shadow(0.1em 0.1em 0.15em black);

  padding: 0.75em;
  gap: 0.45em;
  min-width: 7.5em;
  min-height: 4em;

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
  font-size: ${({ size }) => size}em;
  text-shadow: ${({ size }) => `0 0 ${size * 0.4}rem white`};
  pointer-events: none;
`;

const Icon = styled.img<{ size: number }>`
  height: ${({ size }) => size}em;
  width: ${({ size }) => size}em;
  filter: drop-shadow(0 0 0.2em #bbb);
  user-drag: none;
`;

const Footer = styled.div`
  font-size: 1em;
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
