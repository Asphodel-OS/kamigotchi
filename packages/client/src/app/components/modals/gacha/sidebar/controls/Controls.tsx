import styled from 'styled-components';

import { Filter, Sort } from '../../types';
// import { Filter as FilterComponent } from './Filter';
// import { Sort as SortComponent } from './Sort';
import { Overlay, Pairing, Warning } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { Commit } from 'network/shapes/Commit';
import { MintControls } from './mint/MintControls';
import { RerollControls } from './reroll/RerollControls';

interface Props {
  tab: string;
  actions: {
    reveal: (commits: Commit[]) => Promise<void>;
  };
  controls: {
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
    limit: number;
    setLimit: (limit: number) => void;
  };
  data: {
    commits: Commit[];
    gachaBalance: number;
    rerollBalance: number;
  };
}

//
export const Controls = (props: Props) => {
  const { tab, actions, controls, data } = props;
  const { gachaBalance, rerollBalance } = data;
  const { reveal } = actions;
  const { commits } = data;

  // NOTE: this would be more elegant by processing the relevant item
  const CurrencyPairing = () => {
    if (tab === 'MINT')
      return (
        <Pairing
          icon={ItemImages.gacha_ticket}
          text={gachaBalance.toFixed(1)}
          tooltip={['Gacha Ticket']}
          reverse
        />
      );
    else if (tab === 'REROLL')
      return (
        <Pairing
          icon={ItemImages.reroll_ticket}
          text={rerollBalance.toFixed(1)}
          tooltip={['Reroll Ticket']}
          reverse
        />
      );
    else return <></>;
  };

  return (
    <Container>
      {commits.length > 0 && (
        <Warning
          text={{
            value: `You have ${commits.length} unrevealed commit(s)`,
          }}
          action={{
            onClick: () => reveal(commits),
            label: 'Reveal',
          }}
        />
      )}
      {tab === 'MINT' && <MintControls controls={controls} />}
      {tab === 'REROLL' && <RerollControls />}
      <Overlay right={0.75} bottom={0.75}>
        <CurrencyPairing />
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;

  overflow-y: scroll;
`;
