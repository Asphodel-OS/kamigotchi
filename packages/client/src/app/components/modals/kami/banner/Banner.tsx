import styled from 'styled-components';

import { Overlay } from 'app/components/library/styles';
import { useSelected, useVisibility } from 'app/stores';
import { StatIcons } from 'assets/images/icons/stats';
import { TraitIcons } from 'assets/images/icons/traits';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiImage } from './KamiImage';

const AffinityColors = {
  normal: '#bbb',
  eerie: '#b575d0',
  insect: '#A1C181',
  scrap: '#d38d50',
};

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
  const traits = kami.traits!;
  const bodyAffinity = traits.body.affinity.toLowerCase() as keyof typeof AffinityColors;
  const handAffinity = traits.hand.affinity.toLowerCase() as keyof typeof AffinityColors;

  const { setAccount } = useSelected();
  const { modals, setModals } = useVisibility();

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
              <Icon src={TraitIcons.body} />
              <Text size={1.2}>{bodyAffinity}</Text>
            </AffinityPairing>
            <AffinityPairing color={AffinityColors[handAffinity]}>
              <Icon src={TraitIcons.hand} />
              <Text size={1.2}>{handAffinity}</Text>
            </AffinityPairing>
          </AffinityContainer>
          <StatsContainer>
            <Text size={1.4}>Stats</Text>
            {Object.entries(kami.stats)
              .filter(([key]) => key !== 'stamina')
              .map(([key, value]) => (
                <StatPairing key={key}>
                  <Icon src={StatIcons[key as keyof typeof StatIcons]} />
                  <Text size={1.1}>{value.total}</Text>
                </StatPairing>
              ))}
          </StatsContainer>
        </Row>
        <Overlay bottom={0.3} right={0.3}>
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
  color: black;
  padding-bottom: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
`;

const Content = styled.div`
  position: relative;
  height: 100%;
  margin: 0.6vw;

  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
`;

const Title = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  padding: ${(props) => `${props.size * 0.9}vw ${props.size * 0.3}vw`};
`;

const Row = styled.div`
  margin: 0 1.2vw 1.2vw 0.6vw;
  gap: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
`;

const AffinityContainer = styled.div`
  height: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
`;

const AffinityPairing = styled.div<{ color?: string }>`
  background-color: ${({ color }) => color ?? '#fff'};
  border: solid black 0.15vw;
  border-radius: 0.6vw;

  padding: 0.9vw;
  gap: 0.5vw;
  width: 10.5vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const StatsContainer = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  padding: 0.9vw;
  margin-left: 0.3vw;
  gap: 0.45vw;

  width: 100%;
  height: 100%;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-end;
`;

const StatPairing = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.6vw;

  padding: 0.45vw;
  gap: 0.45vw;
  width: 6.3vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.4}vw white`};
`;

const Icon = styled.img`
  height: 100%;
  width: auto;
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
