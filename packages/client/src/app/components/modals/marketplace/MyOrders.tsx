import styled from 'styled-components';

import { EmptyText } from 'app/components/library';

export const MyOrders = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <Tab isVisible={isVisible}>
      <EmptyText text={['Coming soon']} size={0.9} />
    </Tab>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 1;
  overflow: auto;
  width: 100%;
  min-height: 10vw;
  align-items: center;
  justify-content: center;
`;
