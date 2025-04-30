import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';
import { Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { playClick } from 'utils/sounds';

interface Props {
  data: { account: Account };
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
  };
}

export const Kamis = (props: Props) => {
  const { data, utils } = props;
  const { account } = data;
  const { getAccountKamis } = utils;

  const { modals, setModals } = useVisibility();
  const { kamiIndex, setKami } = useSelected();
  const [kamis, setKamis] = useState<Kami[]>([]);

  useEffect(() => {
    const kamis = getAccountKamis(account?.entity);
    setKamis(kamis);
  }, [account.entity]);

  const kamiOnClick = (kami: Kami) => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (modals.kami && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  if (kamis.length === 0) return <EmptyText>no kamis. ngmi</EmptyText>;
  return (
    <Container key='grid'>
      {kamis.map((kami) => (
        <Tooltip key={kami.index} text={[kami.name]}>
          <CellContainer id={`grid-${kami.id}`}>
            <Image onClick={() => kamiOnClick(kami)} src={kami.image} />
          </CellContainer>
        </Tooltip>
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

const EmptyText = styled.div`
  color: black;
  margin: 1vw;

  font-size: 1.2vw;
  font-family: Pixel;
`;
