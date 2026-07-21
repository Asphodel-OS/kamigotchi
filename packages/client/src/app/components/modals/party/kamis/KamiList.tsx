import { useMemo } from 'react';
import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { triggerKamiAdoptionAgencyModal } from 'app/triggers';
import { playClick } from 'utils/sounds';
import { objectBellShapedDevice } from 'assets/images/rooms/12_junkyard-machine';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { View } from '../types';
import { KamisCollapsed } from './KamisCollapsed';
import { KamisExternal } from './KamisExternal';
import { KamisExpanded } from './expanded/KamisExpanded';

export const KamiList = ({
  controls: { view },
  data,
  display,
  state,
  utils,
}: {
  controls: {
    view: View;
  };
  data: {
    account: Account;
    accounts: Account[];
    kamis: Kami[];
    wildKamis: Kami[];
    node: Node;
  };
  display: {
    HarvestButton: (account: Account, kami: Kami, node: Node) => JSX.Element;
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
    OnyxReviveButton: (account: Account, kami: Kami) => JSX.Element;
    levelUp: (kami: Kami) => void;
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
}) => {
  const partyModalVisible = useVisibility((s) => s.modals.party);
  const setModals = useVisibility((s) => s.setModals);

  const openMarketplace = () => {
    playClick();
    setModals({ marketplace: true });
  };

  const listedKamis = useMemo(
    () => data.kamis.filter((kami) => kami.state === 'LISTED'),
    [data.kamis]
  );

  /////////////////
  // DISPLAY

  return (
    <Container>
      {data.kamis.length == 0 && view !== 'external' && (
        <>
          <EmptyText
            linkColor='#d44c79'
            text={[
              'You are Kamiless.',
              '\n',
              {
                before: 'New? Get your first Kami at the ',
                linkText: 'Adoption Agency',
                onClick: () => triggerKamiAdoptionAgencyModal(),
                after: '!',
              },
              {
                before: 'Or find one on ',
                linkText: 'KamiSwap',
                onClick: openMarketplace,
                after: '.',
              },
            ]}
          />
          <Row>
            <EmptyText
              text={['If you already have a Kami,', 'go to Scrap Confluence', 'to import them.']}
              size={0.9}
            />
            <Image src={objectBellShapedDevice} />
          </Row>
        </>
      )}

      <KamisExpanded
        data={data}
        display={display}
        state={state}
        utils={utils}
        isVisible={partyModalVisible && view === 'expanded'}
      />
      <KamisCollapsed
        data={data}
        display={display}
        state={state}
        utils={utils}
        isVisible={partyModalVisible && view === 'collapsed'}
      />
      <KamisExternal
        controls={{ view }}
        data={{ ...data, kamis: data.wildKamis, listedKamis }}
        utils={utils}
        isVisible={partyModalVisible && view === 'external'}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
`;

const Image = styled.img`
  width: 7vw;
  image-rendering: pixelated;
`;
