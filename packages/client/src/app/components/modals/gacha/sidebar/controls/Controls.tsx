import styled from 'styled-components';

import { Overlay, Pairing, Warning } from 'app/components/library';
import { Commit } from 'network/shapes/Commit';
import { Item } from 'network/shapes/Item';
import { AuctionMode, Filter, Sort, TabType } from '../../types';
import { Auction } from './auction/Auction';
import { Mint } from './mint/Mint';
import { Reroll } from './reroll/Reroll';

interface Props {
  actions: {
    reveal: (commits: Commit[]) => Promise<void>;
  };
  controls: {
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
    quantity: number;
    setQuantity: (quantity: number) => void;
    price: number;
    setPrice: (price: number) => void;
  };
  data: {
    commits: Commit[];
    payItem: Item;
    saleItem: Item;
    balance: number;
  };
  display: {
    TokenButton: (token: Item) => JSX.Element;
  };
  state: {
    mode: AuctionMode;
    setMode: (mode: AuctionMode) => void;
    tab: TabType;
    tick: number;
  };
}

//
export const Controls = (props: Props) => {
  const { actions, controls, data, display, state } = props;
  const { reveal } = actions;
  const { commits, payItem, balance } = data;
  const { TokenButton } = display;
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
      {tab === 'MINT' && <Mint controls={controls} />}
      {tab === 'REROLL' && <Reroll />}
      {tab === 'AUCTION' && <Auction controls={controls} state={state} />}
      <Overlay right={0.75} bottom={0.75} orientation='row'>
        <Pairing icon={payItem.image} text={balance.toFixed(1)} tooltip={[payItem.name]} reverse />
        {payItem.address && TokenButton(payItem)}
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
