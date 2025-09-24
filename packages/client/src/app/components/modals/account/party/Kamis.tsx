import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';
import { useWatchBlockNumber } from 'wagmi';

import { TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { ExternalIcon } from 'assets/images/icons/menu';
import { useBalance } from 'network/chain/ERC721';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { playClick } from 'utils/sounds';
import { Address } from 'viem';

const REFRESH_INTERVAL = 5000;

export const Kamis = ({
  data,
  utils,
}: {
  data: { account: Account; kamiNFTAddress: Address };
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
    queryKamiByIndex: (index: number) => EntityIndex | undefined;
    getKami: (entity: EntityIndex) => Kami;
  };
}) => {
  const { account, kamiNFTAddress } = data;
  const { getAccountKamis, queryKamiByIndex, getKami } = utils;

  const kamiModalOpen = useVisibility((s) => s.modals.kami);
  const setModals = useVisibility((s) => s.setModals);
  const kamiIndex = useSelected((s) => s.kamiIndex);
  const setKami = useSelected((s) => s.setKami);
  const [kamis, setKamis] = useState<Kami[]>([]);
  const [wildKamis, setWildKamis] = useState<Kami[]>([]);
  const [tick, setTick] = useState(Date.now());

  /////////////////
  // BLOCK WATCHERS

  useWatchBlockNumber({
    onBlockNumber: () => refetchNFTs(),
  });

  const { refetch: refetchNFTs, data: nftData } = useBalance(account.ownerAddress, kamiNFTAddress);

  /////////////////
  // SUBSCRIPTIONS

  // mounting
  useEffect(() => {
    // set ticking
    const refreshClock = () => setTick(Date.now());
    const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const accountKamis = getAccountKamis(account?.entity);
    setKamis(accountKamis);
  }, [account?.entity, tick]);

  // update list of wild kamis whenever that changes
  // TOTO: properly typecast the result of the abi call
  useEffect(() => {
    const result = (nftData?.[0]?.result ?? []) as number[];
    if (result.length != wildKamis.length) {
      const entities = result.map((index: number) => queryKamiByIndex(index));
      const filtered = entities.filter((entity) => !!entity) as EntityIndex[];
      const externalKamis = filtered.map((entity: EntityIndex) => getKami(entity));
      setWildKamis(externalKamis);
    }
  }, [nftData, account?.entity]);

  const kamiOnClick = (kami: Kami) => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (kamiModalOpen && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  if (kamis.length === 0 && wildKamis.length === 0) return <EmptyText>no kamis. ngmi</EmptyText>;

  return (
    <Container key='grid'>
      {kamis.map((kami, idx) => (
        <TextTooltip key={`internal-${kami.index}-${kami.id}-${idx}`} text={[kami.name, '']}>
          <CellContainer id={`grid-${kami.id}`}>
            <Image onClick={() => kamiOnClick(kami)} src={kami.image} />
          </CellContainer>
        </TextTooltip>
      ))}

      {wildKamis.map((kami, idx) => (
        <TextTooltip key={`wild-${kami.index}-${kami.id}-${idx}`} text={[kami.name, 'in the wild']}>
          <CellContainer id={`grid-${kami.id}`}>
            <Image onClick={() => kamiOnClick(kami)} src={kami.image} />
            <ExtIcon src={ExternalIcon} />
          </CellContainer>
        </TextTooltip>
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: wrap;
  justify-content: center;
  align-items: flex-start;
`;

const CellContainer = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.25vw;

  margin: 0.3vh 0.4vw;
  position: relative;
`;

const Image = styled.img`
  border-radius: 0.1vw;
  height: 8vw;
  cursor: pointer;
  &:hover {
    opacity: 0.75;
  }
`;

const ExtIcon = styled.img`
  position: absolute;
  width: 2.5vw;
  right: 0vw;
  bottom: 0vw;
`;

const EmptyText = styled.div`
  color: black;
  margin: 1vw;

  font-size: 1.2vw;
  font-family: Pixel;
`;
