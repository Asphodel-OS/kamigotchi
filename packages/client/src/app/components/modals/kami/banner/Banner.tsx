import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { useSelected, useVisibility } from 'app/stores';
import { StatIcons } from 'assets/images/icons/stats';
import { TraitIcons } from 'assets/images/icons/traits';
import { AffinityColors } from 'constants/affinities';
import { StatColors, StatDescriptions } from 'constants/stats';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiImage } from './KamiImage';

interface Props {
  data: {
    account: Account;
    kami: Kami;
  };
  actions: {
    levelUp: (kami: Kami) => void;
  };
}

export const Banner = (props: Props) => {
  const { account, kami } = props.data;
  const { setAccount } = useSelected();
  const { modals, setModals } = useVisibility();

  const traits = kami.traits!;
  const bodyAffinity = traits.body.affinity.toLowerCase() as keyof typeof AffinityColors;
  const handAffinity = traits.hand.affinity.toLowerCase() as keyof typeof AffinityColors;
  const excludedStats = ['stamina', 'slots'];

  const isMine = (kami: Kami) => {
    return kami.account?.index === account.index;
  };

  const handleAccountClick = () => {
    if (!isMine(kami))
      return () => {
        setAccount(kami.account?.index || 0);
        setModals({
          ...modals,
          account: true,
          kami: false,
          party: false,
          map: false,
        });
        playClick();
      };
  };

  ///////////////////
  // DISPLAY

  return (
    <Container>
      <KamiImage account={account} kami={kami} actions={props.actions} />
      <Content>
        <Title size={2.4}>{kami.name}</Title>
        <Row>
          <AffinityContainer>
            <AffinityPairing color={AffinityColors[bodyAffinity]}>
              <Icon size={2.4} src={TraitIcons.body} />
              <Text size={1.4}>{bodyAffinity}</Text>
            </AffinityPairing>
            <AffinityPairing color={AffinityColors[handAffinity]}>
              <Icon size={2.4} src={TraitIcons.hand} />
              <Text size={1.4}>{handAffinity}</Text>
            </AffinityPairing>
          </AffinityContainer>
          <StatsContainer>
            {Object.entries(kami.stats)
              .filter(([key]) => !excludedStats.includes(key))
              .map(([key, value]) => (
                <Tooltip
                  key={key}
                  text={[
                    `${key} (${value.base} + ${value.shift})`,
                    '',
                    StatDescriptions[key as keyof typeof StatDescriptions],
                  ]}
                  grow
                >
                  <StatPairing key={key} color={StatColors[key as keyof typeof StatColors]}>
                    <Icon size={2.1} src={StatIcons[key as keyof typeof StatIcons]} />
                    <Text size={1.1}>{value.total}</Text>
                  </StatPairing>
                </Tooltip>
              ))}
          </StatsContainer>
        </Row>
        <Overlay bottom={0.75} right={0.75}>
          <Footer onClick={handleAccountClick()}>
            {isMine(kami) ? 'yours' : kami.account?.name}
          </Footer>
        </Overlay>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border-bottom: solid black 0.15vw;
  display: flex;
  flex-flow: row nowrap;
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

const AffinityPairing = styled.div<{ color?: string }>`
  position: relative;
  background-color: ${({ color }) => color ?? '#fff'};
  border: solid black 0.15vw;
  border-radius: 1.2vw;

  width: 12vw;
  padding: 0.9vw;
  gap: 0.6vw;
  filter: drop-shadow(-0.05vw 0.1vw 0.15vw black);

  flex-grow: 1;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const StatsContainer = styled.div`
  background-color: #888;
  border: solid black 0.15vw;
  border-radius: 1.2vw;
  filter: drop-shadow(-0.05vw 0.1vw 0.15vw black);

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
  filter: drop-shadow(-0.05vw 0.1vw 0.15vw black);

  padding: 0.75vw;
  gap: 0.45vw;
  min-width: 7.5vw;
  min-height: 4vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.4}vw white`};
`;

const Icon = styled.img<{ size: number }>`
  height: ${(props) => props.size}vw;
  width: ${(props) => props.size}vw;
  filter: drop-shadow(0 0 0.2vw #bbb);
`;

const Footer = styled.div`
  font-size: 0.6vw;
  text-align: right;
  color: #666;

  ${({ onClick }) => !onClick && 'pointer-events: none;'}

  &:hover {
    opacity: 0.6;
    cursor: pointer;
    text-decoration: underline;
  }
`;
