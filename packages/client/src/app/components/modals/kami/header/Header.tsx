import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
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

interface Props {
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
}

export const Header = (props: Props) => {
  const { data, utils } = props;
  const { account, kami, owner } = data;
  const { setAccount } = useSelected();
  const { setModals } = useVisibility();

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
      <KamiImage data={data} actions={props.actions} utils={utils} />
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
                  <Tooltip
                    key={name}
                    text={[`${name} (${value.base} + ${value.shift})`, '', description]}
                    grow
                  >
                    <StatPairing key={name} color={color} onMouseDown={playClick}>
                      <Icon size={2.1} src={icon} />
                      <Text size={1.1}>{value.total}</Text>
                    </StatPairing>
                  </Tooltip>
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
  border-bottom: solid black 0.15vw;
  display: flex;
  flex-flow: row nowrap;
  user-select: none;
`;

const Content = styled.div`
  position: relative;
  height: 100%;
  padding: 0.75vw 0vw;

  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
`;

const Title = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  padding: ${(props) => `${props.size * 0.75}vw ${props.size * 0.45}vw`};

  align-self: flex-start;
  user-select: none;
`;

const Row = styled.div`
  height: 10vw;
  gap: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  justify-content: center;
`;

const AffinityContainer = styled.div`
  height: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
`;

const StatsContainer = styled.div`
  background-color: #999;
  border: solid black 0.15vw;
  border-radius: 1.2vw;
  filter: drop-shadow(0.3vw 0.3vw 0.15vw black);

  height: 100%;
  width: 19.3vw;
  padding: 0.6vw;
  gap: 0.6vw;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: stretch;
`;

const StatPairing = styled.div<{ color?: string }>`
  background-color: ${({ color }) => color ?? '#fff'};
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  filter: drop-shadow(0.3vw 0.3vw 0.15vw black);

  padding: 0.75vw;
  gap: 0.45vw;
  min-width: 7.5vw;
  min-height: 4vw;

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
  font-size: ${(props) => props.size}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.4}vw white`};
  pointer-events: none;
`;

const Icon = styled.img<{ size: number }>`
  height: ${(props) => props.size}vw;
  width: ${(props) => props.size}vw;
  filter: drop-shadow(0 0 0.2vw #bbb);
  user-drag: none;
`;

const Footer = styled.div`
  font-size: 0.6vw;
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
