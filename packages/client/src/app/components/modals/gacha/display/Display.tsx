import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { ActionButton, Overlay } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami';
import { Filter, Sort, TabType, ViewMode } from '../types';
import { Mint } from './mint/Mint';
import { Pool } from './pool/Pool';
import { Reroll } from './reroll/Reroll';

interface Props {
  caches: {
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  controls: {
    tab: TabType;
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    filters: Filter[];
    sorts: Sort[];
  };
  data: {
    account: Account;
    accountEntity: EntityIndex;
    poolKamis: EntityIndex[];
    auctions: {
      gacha: Auction;
      reroll: Auction;
    };
  };
  state: {
    setQuantity: (quantity: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (selectedKamis: Kami[]) => void;
    tick: number;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
    getAccountKamis: () => Kami[];
  };
}

export const Display = (props: Props) => {
  const { state, controls, data, caches, utils } = props;
  const { mode, setMode, tab } = controls;
  const { account, auctions, poolKamis } = data;

  const toggleMode = () => {
    if (mode === 'DEFAULT') setMode('ALT');
    else setMode('DEFAULT');
  };

  const getButtonText = () => {
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') return 'Get Gacha Tickets';
      else return 'Back to Gacha';
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') return 'Get Reroll Tickets';
      else return 'Back to Reroll';
    }
    return '???';
  };

  return (
    <Container>
      <Pool
        caches={caches}
        controls={controls}
        data={{ account, auction: auctions.gacha, entities: poolKamis }}
        utils={utils}
        isVisible={tab === 'GACHA'}
      />
      <Reroll
        controls={controls}
        data={{ ...data, auction: auctions.reroll }}
        state={state}
        utils={utils}
        isVisible={tab === 'REROLL'}
      />
      <Mint isVisible={tab === 'MINT'} />
      <Overlay top={0.9} right={0.6}>
        <ActionButton text={getButtonText()} onClick={toggleMode} />
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  background-color: #beb;
  max-height: 100%;
  width: 100%;
  border-radius: 0 0 0 1.2vw;

  display: flex;
`;
