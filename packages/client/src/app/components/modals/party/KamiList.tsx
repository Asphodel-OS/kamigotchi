import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { KamiBars } from './KamiBars';
import { Kards } from './Kards';
import { Toolbar } from './Toolbar';
import { Sort } from './types';

export const WHALE_LIMIT = 6;

interface Props {
  actions: {
    onyxApprove: (price: number) => void;
    onyxRevive: (kami: Kami) => void;
    addKami: (kamis: Kami[]) => void;
  };
  data: {
    account: Account;
    kamis: Kami[];
    node: Node;
    onyx: {
      allowance: number;
      balance: number;
    };
  };
  utils: { passesNodeReqs: (kami: Kami) => boolean };

  display: {
    HarvestButton: (account: Account, kami: Kami, node: Node) => JSX.Element;
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
  };
  state: {
    tick: number;
  };
}

export const KamiList = (props: Props) => {
  const { actions, data, display, state, utils } = props;
  const { addKami } = actions;
  const { kamis } = data;
  const { tick } = state;

  const [sort, setSort] = useState<Sort>('index');
  const [collapsed, setCollapsed] = useState(false);
  const [displayedKamis, setDisplayedKamis] = useState<Kami[]>(kamis);

  useEffect(() => {
    if (kamis.length <= WHALE_LIMIT) setDisplayedKamis(kamis);
  }, [kamis]);

  /////////////////
  // DISPLAY

  return (
    <Container>
      {kamis.length == 0 && (
        <EmptyText text={['Need Kamis?', 'Some have been seen in the Vending Machine.']} />
      )}
      {kamis.length > WHALE_LIMIT && (
        <Toolbar
          actions={{ addKami }}
          utils={utils}
          data={data}
          state={{ sort, setSort, collapsed, setCollapsed, setDisplayedKamis }}
        />
      )}
      <Kards
        actions={actions}
        data={data}
        display={display}
        state={{ displayedKamis }}
        isVisible={!collapsed}
      />
      <KamiBars
        actions={actions}
        data={data}
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
