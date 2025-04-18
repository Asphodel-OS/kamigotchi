import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { Overlay } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { GachaMintData } from 'network/shapes/Gacha';
import { TabType, ViewMode } from '../../types';
import { Public } from './Public';
import { Whitelist } from './Whitelist';

const CLAIMED = 1337;

interface Props {
  isVisible: boolean;
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    tab: TabType;
  };
  data: {
    account: Account;
  };
  state: {
    tick: number;
  };
  utils: {
    getMintConfig: () => GachaMintConfig;
    getMintData: (id: EntityID) => GachaMintData;
    isWhitelisted: (entity: EntityIndex) => boolean;
  };
}

export const Mint = (props: Props) => {
  const { isVisible, controls, data, state, utils } = props;
  const { tab } = controls;
  const { account } = data;
  const { tick } = state;
  const { getMintConfig, getMintData, isWhitelisted } = utils;
  const { modals, setModals } = useVisibility();

  const [mintConfig, setMintConfig] = useState<GachaMintConfig>(getMintConfig());
  const [accountMintData, setAccountMintData] = useState<GachaMintData>(getMintData(account.id));
  const [gachaMintData, setGachaMintData] = useState<GachaMintData>(getMintData('' as EntityID));
  const [whitelisted, setWhitelisted] = useState<boolean>(isWhitelisted(account.entity));

  useEffect(() => {
    if (!modals.gacha || tab !== 'MINT') return;
    setAccountMintData(getMintData(account.id));
    setWhitelisted(isWhitelisted(account.entity));
  }, [account.entity, tick]);

  return (
    <Container isVisible={isVisible}>
      <Whitelist controls={controls} state={state} claimed={CLAIMED} />
      <Public controls={controls} state={state} claimed={CLAIMED} />
      <Overlay bottom={6}>
        <Text>good things come</Text>
      </Overlay>
      <Overlay bottom={3}>
        <Text>to those who mint kamis</Text>
      </Overlay>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  position: relative;
  width: 100%;

  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: 2.5vw;
`;

const Text = styled.div`
  font-size: 1.2vw;
  line-height: 1.8vw;
  color: #b9e9b9;
`;
