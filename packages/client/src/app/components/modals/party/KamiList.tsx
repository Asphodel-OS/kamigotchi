import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { KamiBars } from './KamiBars';
import { Kards } from './Kards';
import { View } from './types';

interface Props {
  actions: {
    onyxApprove: (price: number) => void;
    onyxRevive: (kami: Kami) => void;
    addKamis: (kamis: Kami[]) => void;
  };
  controls: {
    view: View;
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
  display: {
    HarvestButton: (account: Account, kami: Kami, node: Node) => JSX.Element;
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
  };
  state: {
    displayedKamis: Kami[];
    tick: number;
  };
}

export const KamiList = (props: Props) => {
  const { actions, controls, data, display, state } = props;
  const { kamis } = data;
  const { view } = controls;
  const { displayedKamis, tick } = state;

  /////////////////
  // DISPLAY

  return (
    <Container>
      {kamis.length == 0 && (
        <EmptyText text={['You are Kamiless.', 'Go to Sudoswap to get a Kami!']} />
      )}
      <Kards
        actions={actions}
        data={data}
        display={display}
        state={{ displayedKamis }}
        isVisible={view === 'expanded'}
      />
      <KamiBars
        actions={actions}
        data={data}
        display={display}
        state={{ displayedKamis, tick }}
        isVisible={view === 'collapsed'}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
