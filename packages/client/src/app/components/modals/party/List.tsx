import { useState } from 'react';
import styled from 'styled-components';

import { isDead } from 'app/cache/kami';
import { EmptyText } from 'app/components/library';
import { FeedIcon, ReviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { KamiBars } from './KamiBars';
import { Kards } from './Kards';
import { Toolbar } from './Toolbar';
import { Sort } from './types';

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
    tick: number;
  };
}

export const KamiList = (props: Props) => {
  const { data, display, state } = props;
  const { account, kamis, node } = data;
  const { HarvestButton, UseItemButton } = display;
  const { tick } = state;

  const [sort, setSort] = useState<Sort>('index');
  const [collapsed, setCollapsed] = useState(false);
  const [displayedKamis, setDisplayedKamis] = useState<Kami[]>(kamis);

  /////////////////
  // DISPLAY

  // Choose and return the action button to display
  const DisplayedAction = (account: Account, kami: Kami, node: Node) => {
    let buttons = [];
    let useIcon = FeedIcon;
    if (isDead(kami)) useIcon = ReviveIcon;
    else buttons.push(HarvestButton(account, kami, node));
    buttons.push(UseItemButton(kami, account, useIcon));
    return buttons;
  };

  return (
    <Container>
      {kamis.length == 0 && (
        <EmptyText text={['Need Kamis?', 'Some have been seen in the Vending Machine.']} />
      )}
      {kamis.length > 6 && (
        <Toolbar
          data={data}
          state={{ sort, setSort, collapsed, setCollapsed, setDisplayedKamis }}
        />
      )}
      <Kards
        data={{ account, kamis, node }}
        display={display}
        state={{ displayedKamis }}
        isVisible={!collapsed}
      />
      <KamiBars
        data={{ account, kamis, node }}
        display={display}
        state={{ displayedKamis, tick }}
        isVisible={collapsed}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
