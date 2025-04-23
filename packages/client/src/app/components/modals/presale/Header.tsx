import styled from 'styled-components';

import { Overlay } from 'app/components/library';
import { PresaleData } from 'network/chain';

const StartTime = Math.floor(Date.now() / 1000) + 3600 * 24;

interface Props {
  data: PresaleData;
}

export const Header = (props: Props) => {
  return (
    <Container>
      <Overlay left={0.9} top={0.9}>
        <Text size={0.9}>Mint is Live</Text>
      </Overlay>
      {/* <Overlay right={0.9} top={0.9}>
                   <Text size={1.2}>Mint is Live</Text>
                 </Overlay> */}
      <Title>$ONYX Presale</Title>
    </Container>
  );
};

const Container = styled.div`
  background-color: red;
  position: relative;

  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`;

const Title = styled.div`
  font-size: 2.4vw;
  margin: 1.2vw;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
