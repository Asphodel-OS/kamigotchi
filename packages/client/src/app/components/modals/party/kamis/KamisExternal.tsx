import styled from 'styled-components';

import { EmptyText, KamiBar } from 'app/components/library';
import { objectBellShapedDevice } from 'assets/images/rooms/12_junkyard-machine';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { View } from '../types';

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
      <Kamis>
        {kamis.map((kami) => (
          <KamiBar key={kami.entity} kami={kami} utils={utils} tick={0} />
        ))}
      </Kamis>
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
`;

const Kamis = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.6vw 0.6vw 0 0.6vw;
  gap: 0.45vw;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
`;

const Image = styled.img`
  width: 7vw;
  image-rendering: pixelated;
`;
