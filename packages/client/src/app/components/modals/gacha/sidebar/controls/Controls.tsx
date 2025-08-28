import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { ActionButton, Overlay, Pairing, Warning } from 'app/components/library';
import { Commit } from 'network/shapes/Commit';
import { GachaMintData } from 'network/shapes/Gacha';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';

import { Filter, Sort, TabType, ViewMode } from '../../types';
import { Mint } from './mint/Mint';
import { Pool } from './pool/Pool';
import { Reroll } from './reroll/Reroll';

//
export const Controls = ({
  actions,
  controls,
  data,
  state,
}: {
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
    mint: {
      config: GachaMintConfig;
      data: {
        account: GachaMintData;
        gacha: GachaMintData;
      };
      whitelisted: boolean;
    };
  };
  state: {
    quantity: number;
    setQuantity: (quantity: number) => void;
    price: number;
    selectedKamis: Kami[];
    tick: number;
  };
  utils: {
    isWhitelisted: (entity: EntityIndex) => boolean;
  };
}) => {
  const { reveal } = actions;
  const { mode, setMode, tab } = controls;
  const { commits, payItem, balance } = data;

  // toggle between alt and default modes
  const toggleMode = () => {
    if (mode === 'DEFAULT') setMode('ALT');
    else setMode('DEFAULT');
  };

  const getButtonText = () => {
    if (mode === 'DEFAULT') return 'Get More';
    else return 'Use Tickets';
  };

  const isButtonVisible = () => {
    return tab === 'GACHA';
    return tab === 'GACHA' || tab === 'REROLL';
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
      <Mint controls={controls} data={data} state={state} isVisible={tab === 'MINT'} />
      <Pool controls={controls} data={data} state={state} isVisible={tab === 'GACHA'} />
      <Reroll controls={controls} data={data} state={state} isVisible={tab === 'REROLL'} />
      <Overlay bottom={0.75} left={0.75}>
        {isButtonVisible() && <ActionButton text={getButtonText()} onClick={toggleMode} />}
      </Overlay>
      <Overlay right={0.75} bottom={0.75}>
        <Pairing
          icon={payItem.image}
          text={balance.toLocaleString()}
          tooltip={[payItem.name]}
          reverse
        />
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
