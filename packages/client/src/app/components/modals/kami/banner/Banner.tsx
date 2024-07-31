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
