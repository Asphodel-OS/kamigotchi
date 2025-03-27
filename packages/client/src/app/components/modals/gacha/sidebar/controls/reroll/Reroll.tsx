import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';

interface Props {
  selectedKamis: Kami[];
}
export const Reroll = (props: Props) => {
  const { selectedKamis } = props;

  return (
    <Container>
      {selectedKamis.length > 0 && <Title>Selected Victims</Title>}
      {selectedKamis.map((kami) => (
        <Text key={kami.index}>• {kami.name}</Text>
      ))}
      {selectedKamis.length < 1 && <EmptyText text={['No kamis selected']} />}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;

  overflow-y: scroll;
`;

const Title = styled.div`
  margin: 0.9vw;
  font-size: 1.2vw;
`;

const Text = styled.div`
  margin-left: 1.2vw;
  font-size: 0.9vw;
  line-height: 1.6vw;
`;
