import styled from 'styled-components';

import { Overlay } from 'app/components/library/styles';
import { useSelected, useVisibility } from 'app/stores';
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
  flex-flow: column nowrap;
  align-items: flex-start;
`;

const Title = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  padding: ${(props) => `${props.size * 0.9}vw ${props.size * 0.3}vw`};
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.4}vw white`};
`;

const Icon = styled.img`
  height: 1.5vw;
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
