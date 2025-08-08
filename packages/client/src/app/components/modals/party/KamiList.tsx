import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { KamisCollapsed } from './KamisCollapsed';
import { KamisExpanded } from './KamisExpanded';
import { KamisExternal } from './KamisExternal';
import { View } from './types';

interface Props {
  actions: {
    onyxApprove: (price: number) => void;
    onyxRevive: (kami: Kami) => void;
    addKamis: (kamis: Kami[]) => void;
    sendKamis: (kami: Kami, account: Account) => void;
    stakeKamis: (kamis: Kami[]) => void;
  };
  controls: {
    view: View;
  };
  data: {
    account: Account;
    accounts: Account[];
    kamis: Kami[];
    wildKamis: Kami[];
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
    calcExpRequirement: (lvl: number) => number;
    getTempBonuses: (kami: Kami) => Bonus[];
    getAllAccounts: () => Account[];
  };
}

export const KamiList = (props: Props) => {
  const { actions, controls, data, display, state, utils } = props;
  const { kamis, wildKamis } = data;
  const { view } = controls;
  const { displayedKamis, tick } = state;
  const { modals } = useVisibility();

  /////////////////
  // DISPLAY

  return (
    <Container>
      {kamis.length == 0 && view !== 'external' && (
        <EmptyText
          linkColor='#d44c79'
          text={[
            'You are Kamiless.',
            '\n',
            {
              before: 'Go to ',
              linkText: 'Sudoswap',
              href: 'https://sudoswap.xyz/#/browse/yominet/buy/0x5d4376b62fa8ac16dfabe6a9861e11c33a48c677',
              after: ' to get a Kami! ',
            },
            'If you already have Kami, go to Scrap Confluence to bridge them in.',
          ]}
        />
      )}

      <KamisExpanded
        actions={actions}
        data={data}
        display={display}
        state={{ displayedKamis }}
        utils={utils}
        isVisible={modals.party && view === 'expanded'}
      />

      <KamisCollapsed
        actions={actions}
        data={data}
        display={display}
        state={{ displayedKamis, tick }}
        utils={utils}
        isVisible={modals.party && view === 'collapsed'}
      />
      <KamisExternal
        actions={actions}
        controls={controls}
        data={{ ...data, kamis: data.wildKamis }}
        utils={utils}
        isVisible={modals.party && view === 'external'}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
