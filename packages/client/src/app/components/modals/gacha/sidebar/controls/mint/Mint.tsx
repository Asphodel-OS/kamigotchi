import styled from 'styled-components';

import { EmptyText } from 'app/components/library';

interface Props {
  isVisible: boolean;
}
export const Mint = (props: Props) => {
  const { isVisible } = props;

  return (
    <Container isVisible={isVisible}>
      <EmptyText text={['COMING SOON']} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: flex-start;
`;
