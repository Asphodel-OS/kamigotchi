import styled from 'styled-components';

import { EmptyText, Overlay } from 'app/components/library';

interface Props {
  isVisible: boolean;
}
export const Mint = (props: Props) => {
  const { isVisible } = props;

  return (
    <Container isVisible={isVisible}>
      <EmptyText text={['Good things come', ' to those who wait']} size={2.1} />
      <Overlay bottom={6}>
        <Text>better things come</Text>
      </Overlay>
      <Overlay bottom={3}>
        <Text>to those who mint kamis</Text>
      </Overlay>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 95%;
  width: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column nowrap;
  align-items: center;
  justify-content: flex-start;
`;

const Text = styled.div`
  font-size: 1.2vw;
  color: #baeaba;
`;
