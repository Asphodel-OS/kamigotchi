import { Kami, isResting } from 'network/shapes/Kami';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { StatIcons } from 'assets/images/icons/stats';
import { StatDescriptions } from 'constants/stats';
import { Account } from 'network/shapes/Account';
import { Stat } from 'network/shapes/Stats';
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

// TODO: disable level-up when kami is too far or not urs
export const Banner = (props: Props) => {
  const { account, kami } = props.data;

  const { setAccount } = useSelected();
  const { modals, setModals } = useVisibility();

  const isMine = (kami: Kami) => {
    return kami.account?.index === account.index;
  };

  const getLevelUpDisabledReason = () => {
    if (!isMine(kami)) return 'not ur kami';
    if (!isResting(kami)) return 'kami must be resting';
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
        <Title size={1.5}>{kami.name}</Title>
        <Middle>
          <Paragraph>
            <Title size={0.75}>Stats</Title>
            {Object.entries(kami.stats).map(([key, value]) => {
              if (key === 'stamina') return null;
              const description = StatDescriptions[key as keyof typeof StatDescriptions];
              const icon = StatIcons[key as keyof typeof StatIcons];
              const v = value as Stat;

              const total = v.base + v.shift;
              const tooltipText = [key, '', description];
              return (
                <Tooltip key={key} text={tooltipText} grow>
                  <InfoGroup>
                    <Icon src={icon} />
                    <Text size={0.6}>{total}</Text>
                    <Text size={0.45}>
                      ({v.base} + {v.shift})
                    </Text>
                  </InfoGroup>
                </Tooltip>
              );
            })}
          </Paragraph>
        </Middle>
        <Footer>
          <FooterText onClick={handleAccountClick()}>
            {isMine(kami) ? 'yours' : kami.account?.name}
          </FooterText>
        </Footer>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border-bottom: solid black 0.15vw;
  color: black;

  display: flex;
  flex-flow: row nowrap;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 0.7vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  position: relative;
`;

const Middle = styled.div`
  flex-grow: 1;
  width: 80%;
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
`;

const Paragraph = styled.div`
  padding: 0.3vw 1vw;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content:
  gap: .1vw 
  height: 100%;
`;

const InfoGroup = styled.div`
  border-radius: 0.3vw;
  padding: 0.1vw 0.45vw;
  gap: 0.3vw;

  display: flex;
  flex-direction: row;
  &:hover {
    background-color: #ddd;
  }
`;

const Title = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}vw;
  padding: ${({ size }) => `${size * 0.4}vw ${size * 0.2}vw`};
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  margin: auto;
`;

const Icon = styled.img`
  height: 1.2vw;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0.7vw;

  display: flex;
  justify-content: flex-end;
`;

const FooterText = styled.div`
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
