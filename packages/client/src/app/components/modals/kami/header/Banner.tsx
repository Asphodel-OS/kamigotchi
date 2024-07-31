import { Kami } from 'network/shapes/Kami';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { StatIcons } from 'assets/images/icons/stats';
import { StatDescriptions } from 'constants/stats';
import { Account } from 'network/shapes/Account';
import { Stat } from 'network/shapes/Stats';
import { playClick } from 'utils/sounds';
import { Overlay } from '../../../library/styles/Overlay';
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
        <Paragraph>
          {/* <Title size={0.9}>Stats</Title> */}
          {Object.entries(kami.stats).map(([key, value]) => {
            if (key === 'stamina') return null;
            const description = StatDescriptions[key as keyof typeof StatDescriptions];
            const icon = StatIcons[key as keyof typeof StatIcons];
            const v = value as Stat;

            const total = v.base + v.shift;
            const tooltipText = [key, '', description];
            return (
              <Tooltip key={key} text={tooltipText}>
                <Grouping>
                  <Text size={0.75}>{total}</Text>
                  <Icon size={1.3} src={icon} />
                  <Overlay right={0} translateX={100}>
                    <Text size={0.5}>
                      ({v.base} + {v.shift})
                    </Text>
                  </Overlay>
                </Grouping>
              </Tooltip>
            );
          })}
        </Paragraph>
        <Overlay bottom={0.6} right={0.6}>
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

  display: flex;
  flex-flow: row nowrap;
`;

const Content = styled.div`
  position: relative;

  flex-grow: 1;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const Paragraph = styled.div`
  height: 70%;
  margin-left: 1.8vw;

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
