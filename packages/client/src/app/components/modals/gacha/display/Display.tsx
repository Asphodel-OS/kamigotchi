import { EntityID, EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { ActionButton, Overlay } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Auction } from 'network/shapes/Auction';
import { GachaMintData } from 'network/shapes/Gacha';
import { Kami } from 'network/shapes/Kami';
import { Filter, Sort, TabType, ViewMode } from '../types';
import { Mint } from './mint/Mint';
import { Pool } from './pool/Pool';
import { Reroll } from './reroll/Reroll';

export const Display = ({
  caches,
  controls,
  data,
  state,
  utils,
}: {
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
    poolKamis: EntityIndex[];
    auctions: {
      gacha: Auction;
      reroll: Auction;
    };
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
    setQuantity: (quantity: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (selectedKamis: Kami[]) => void;
    tick: number;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
    getAccountKamis: () => Kami[];
    getMintConfig: () => GachaMintConfig;
    getMintData: (id: EntityID) => GachaMintData;
  };
}) => {
  const { mode, setMode, tab } = controls;
  const { account, auctions, mint, poolKamis } = data;

  const toggleMode = () => {
    if (mode === 'DEFAULT') setMode('ALT');
    else setMode('DEFAULT');
  };

  const getButtonText = () => {
    let text = '???';

    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') text = 'Auction >';
      else text = '< Gacha';
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') text = 'Auction >';
      else text = '< Reroll';
    }

    return text;
  };

  // determine whether the mode toggle button should be visible
  const isButtonVisible = () => {
    return tab === 'GACHA' || tab === 'REROLL';
    // if (tab === 'GACHA' && mode === 'DEFAULT') {
    //   const startTime = auctions.gacha.time.start;
    //   return startTime > Date.now();
    // }

    // if (tab === 'REROLL' && mode == 'DEFAULT') {
    //   const startTime = auctions.reroll.time.start;
    //   return startTime > Date.now();
    // }

    // return false;
  };

  return (
    <Container>
      <Pool
        caches={caches}
        controls={controls}
        data={{
          ...data,
          account,
          mintConfig: mint.config,
          auction: auctions.gacha,
          entities: poolKamis,
        }}
        state={state}
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
      <Mint controls={controls} data={data} state={state} isVisible={tab === 'MINT'} />
      <Overlay top={0.9} right={0.6}>
        {isButtonVisible() && <ActionButton text={getButtonText()} onClick={toggleMode} />}
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
