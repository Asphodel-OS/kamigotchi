import styled from 'styled-components';

import { Overlay, Pairing, Warning } from 'app/components/library';
import { Commit } from 'network/shapes/Commit';
import { Item } from 'network/shapes/Item';
import { Filter, Sort, TabType } from '../../types';
import { MintControls } from './mint/MintControls';
import { RerollControls } from './reroll/RerollControls';

interface Props {
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
    item: Item;
    balance: number;
  };
  state: {
    tick: number;
    tab: TabType;
  };
}

//
export const Controls = (props: Props) => {
  const { actions, controls, data, state } = props;
  const { reveal } = actions;
  const { commits, item, balance } = data;
  const { tab } = state;

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
        <Pairing icon={item.image} text={balance.toFixed(1)} tooltip={[item.name]} reverse />
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
