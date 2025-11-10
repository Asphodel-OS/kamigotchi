import styled from 'styled-components';
import { Book } from './Book';
import { HelpTabs } from './types';

export const Books = ({
  setTab,
}: {
  setTab: Function;
}) => {
  return (
    <Container>
      <Book key={HelpTabs.WORLD} infoKey={HelpTabs.WORLD} setTab={setTab} />
      <Book key={HelpTabs.KAMIS} infoKey={HelpTabs.KAMIS} setTab={setTab} />
      <Book key={HelpTabs.NODES} infoKey={HelpTabs.NODES} setTab={setTab} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  padding: 2.4em;
  gap: 1.5em;
`;
