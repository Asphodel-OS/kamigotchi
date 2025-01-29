import styled from 'styled-components';

import { Filter, Sort } from '../../types';
// import { Filter as FilterComponent } from './Filter';
// import { Sort as SortComponent } from './Sort';
import { Warning } from 'app/components/library';
import { Commit } from 'network/shapes/Commit';
import { MintControls } from './mint/MintControls';

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
  };
}

//
export const Controls = (props: Props) => {
  const { tab, actions, controls, data } = props;
  const { reveal } = actions;
  const { commits } = data;

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
      {tab === 'MINT' && <MintControls tab={tab} controls={controls} />}
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
