import styled from 'styled-components';

import { EmptyText, Text } from 'app/components/library';

export const History = ({
  isCollapsed,
  onToggleCollapse,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) => {
  return (
    <Container>
      <TitleBar onClick={onToggleCollapse}>
        <TitleLeft>
          <CollapseIcon $isCollapsed={isCollapsed}>▼</CollapseIcon>
          <Text size={0.9}>Send History</Text>
        </TitleLeft>
      </TitleBar>

      <ContentWrapper $isCollapsed={isCollapsed}>
        <EmptyText text={['No send history available yet.']} size={0.8} />
      </ContentWrapper>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-top: 0.15vw solid black;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
`;

const TitleBar = styled.div`
  background-color: rgb(221, 221, 221);
  width: 100%;
  min-height: 2.5vw;
  padding: 0.6vw 0.9vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;

  &:hover {
    background-color: rgb(200, 200, 200);
  }
`;

const TitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
`;

const CollapseIcon = styled.span<{ $isCollapsed: boolean }>`
  font-size: 0.7vw;
  color: #555;
  transition: transform 0.2s;
  transform: rotate(${({ $isCollapsed }) => ($isCollapsed ? '-90deg' : '0deg')});
`;

const ContentWrapper = styled.div<{ $isCollapsed: boolean }>`
  display: ${({ $isCollapsed }) => ($isCollapsed ? 'none' : 'flex')};
  flex-direction: column;
  max-height: 15vh;
  overflow-y: auto;

  ::-webkit-scrollbar {
    background: transparent;
    width: 0.5vw;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 0.25vw;
  }
`;
