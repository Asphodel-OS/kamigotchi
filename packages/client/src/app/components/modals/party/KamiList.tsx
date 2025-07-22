import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
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
  utils: {
    getBonusesByItems: (kami: Kami) => Bonus[];
  };
}

export const KamiList = (props: Props) => {
  const { actions, controls, data, display, state, utils } = props;
  const { kamis } = data;
  const { view } = controls;
  const { displayedKamis, tick } = state;

  /////////////////
  // DISPLAY

  return (
    <Container>
      {kamis.length == 0 && (
        <EmptyText
          linkColor='#d44c79'
          text={[
            [
              'You are Kamiless. ',
              '\n',
              ' Go to ',
              {
                text: 'Sudoswap',
                href: 'https://sudoswap.xyz/#/browse/yominet/buy/0x5d4376b62fa8ac16dfabe6a9861e11c33a48c677',
              },
              ' to get a Kami!',
            ],
            ['If you already have Kami, go to Scrap Confluence to bridge them in.'],
          ]}
        />
      )}
      <Kards
        actions={actions}
        data={data}
        display={display}
        state={{ displayedKamis }}
        utils={utils}
        isVisible={view === 'expanded'}
      />
      <KamiBars
        actions={actions}
        data={data}
        display={display}
        state={{ displayedKamis, tick }}
        utils={utils}
        isVisible={view === 'collapsed'}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
