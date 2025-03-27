import styled from 'styled-components';

import { Overlay, Pairing, Warning } from 'app/components/library';
import { Commit } from 'network/shapes/Commit';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { Filter, Sort, TabType, ViewMode } from '../../types';
import { Auction } from './auction/Auction';
import { Mint } from './mint/Mint';
import { Reroll } from './reroll/Reroll';

interface Props {
  actions: {
    reveal: (commits: Commit[]) => Promise<void>;
  };
  controls: {
    tab: TabType;
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
  };
  data: {
    commits: Commit[];
    payItem: Item;
    saleItem: Item;
    balance: number;
  };
  state: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    quantity: number;
    setQuantity: (quantity: number) => void;
    price: number;
    setPrice: (price: number) => void;
    selectedKamis: Kami[];
    tick: number;
  };
}

//
export const Controls = (props: Props) => {
  const { actions, controls, data, state } = props;
  const { reveal } = actions;
  const { tab } = controls;
  const { commits, payItem, balance } = data;
  const { mode, selectedKamis } = state;

  const getBalanceText = () => {
    let numDecimals = 0;
    if (tab === 'REROLL' && mode === 'ALT') numDecimals = 3;
    return balance.toFixed(numDecimals);
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
      {tab === 'MINT' && <Mint controls={controls} />}
      {tab === 'REROLL' && <Reroll selectedKamis={selectedKamis} />}
      {tab === 'AUCTION' && <Auction controls={controls} state={state} />}
      <Overlay right={0.75} bottom={0.75} orientation='row'>
        <Pairing icon={payItem.image} text={getBalanceText()} tooltip={[payItem.name]} reverse />
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
