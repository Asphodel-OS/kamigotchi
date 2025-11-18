import React from 'react';
import styled from 'styled-components';

import { EmptyText, KamiBar } from 'app/components/library';
import { objectBellShapedDevice } from 'assets/images/rooms/12_junkyard-machine';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { View } from './types';

// resorting to this pattern as useMemo and useCallback don't seem to be effective
const StakeButtons = new Map<number, React.ReactNode>();
const SendButtons = new Map<number, React.ReactNode>();

export const KamisExternal = ({
  data: { kamis },
  isVisible,
  utils,
}: {
  controls: {
    view: View;
  };
  data: {
    account: Account;
    accounts: Account[];
    kamis: Kami[];
  };
  utils: {
    getTempBonuses: (kami: Kami) => Bonus[];
  };
  isVisible: boolean;
}) => {
  /////////////////
  // RENDER

  return (
    <Container isVisible={isVisible}>
      {kamis.map((kami) => (
        <KamiBar key={kami.entity} kami={kami} utils={utils} tick={0} />
      ))}
      <EmptyText text={['You can import your new Kami', 'through the Kami Portal.']} size={1.2} />
      <Row>
        <EmptyText
          text={[
            'You can find the Portal',
            'at the Scrap Confluence,',
            'West of the Vending Machine.',
          ]}
          size={0.9}
        />
        <Image src={objectBellShapedDevice} />
      </Row>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column nowrap;
  gap: 0.45vw;
  padding: 0.6vw;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 0.6vw;
`;

const Image = styled.img`
  width: 7vw;
  image-rendering: pixelated;
`;
