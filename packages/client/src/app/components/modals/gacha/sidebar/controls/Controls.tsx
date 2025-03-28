import styled from 'styled-components';

import { Overlay, Pairing, Warning } from 'app/components/library';
import { Commit } from 'network/shapes/Commit';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { Filter, Sort, TabType, ViewMode } from '../../types';
import { Mint } from './mint/Mint';
import { Pool } from './pool/Pool';
import { Reroll } from './reroll/Reroll';

interface Props {
  actions: {
    reveal: (commits: Commit[]) => Promise<void>;
  };
  controls: {
    tab: TabType;
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
  };
  data: {
    balance: number;
    commits: Commit[];
    payItem: Item;
    saleItem: Item;
  };
  state: {
    quantity: number;
    setQuantity: (quantity: number) => void;
    price: number;
    selectedKamis: Kami[];
    tick: number;
  };
}

//
export const Controls = (props: Props) => {
  const { actions, controls, data, state } = props;
  const { reveal } = actions;
  const { mode, tab } = controls;
  const { commits, payItem, balance } = data;

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
      <Pool controls={controls} data={data} state={state} isVisible={tab === 'GACHA'} />
      <Reroll controls={controls} data={data} state={state} isVisible={tab === 'REROLL'} />
      <Mint isVisible={tab === 'MINT'} />
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
