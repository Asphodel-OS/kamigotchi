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
        <Middle>
          <Paragraph>
            <Title size={1.1}>Stats</Title>
            {Object.entries(kami.stats).map(([key, value]) => {
              if (key === 'stamina') return null;
              const description = StatDescriptions[key as keyof typeof StatDescriptions];
              const icon = StatIcons[key as keyof typeof StatIcons];
              const v = value as Stat;

              const total = v.base + v.shift;
              const tooltipText = [key, '', description];
              return (
                <Tooltip key={key} text={tooltipText} grow>
                  <Grouping>
                    <Icon size={1.5} src={icon} />
                    <Text size={0.75}>{total}</Text>
                    <Text size={0.6}>
                      ({v.base} + {v.shift})
                    </Text>
                  </Grouping>
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
  padding: 0.7vw;

  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  position: relative;
`;

const Middle = styled.div`
  width: 80%;

  flex-grow: 1;
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
`;

const Paragraph = styled.div`
  padding: 0.3vw 1.2vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
`;

const Grouping = styled.div`
  border-radius: 0.3vw;
  padding: 0.15vw 0.45vw;
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
