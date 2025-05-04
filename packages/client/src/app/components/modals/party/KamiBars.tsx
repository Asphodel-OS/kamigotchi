import styled from 'styled-components';

import { isDead } from 'app/cache/kami';
import { FeedIcon, ReviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { KamiBar } from './KamiBar';

interface Props {
  data: {
    account: Account;
    kamis: Kami[];
    node: Node;
  };
  display: {
    HarvestButton: (account: Account, kami: Kami, node: Node) => JSX.Element;
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
  };
  state: {
    displayedKamis: Kami[];
    tick: number;
  };
  isVisible: boolean;
}

export const KamiBars = (props: Props) => {
  const { data, display, state, isVisible } = props;
  const { account, node } = data;
  const { displayedKamis, tick } = state;
  const { HarvestButton, UseItemButton } = display;

  /////////////////
  // DISPLAY

  // Choose and return the action button to display
  const DisplayedActions = (account: Account, kami: Kami, node: Node) => {
    let buttons = [];
    let useIcon = FeedIcon;
    if (isDead(kami)) useIcon = ReviveIcon;
    else buttons.push(HarvestButton(account, kami, node));
    buttons.push(UseItemButton(kami, account, useIcon));
    return buttons;
  };

  return (
    <Container isVisible={isVisible}>
      {displayedKamis.map((kami) => (
        <KamiBar
          key={kami.entity}
          kami={kami}
          actions={DisplayedActions(account, kami, node)}
          tick={tick}
        />
      ))}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column nowrap;
  gap: 0.45vw;
  padding: 0.6vw;
`;
