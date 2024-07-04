import styled from 'styled-components';
import { Book } from './Book';
import { HelpTabs } from './types';

interface Props {
  setTab: Function;
}

export const Books = (props: Props) => {
  const { setTab } = props;
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
  padding: 2.4vw;
  gap: 1.5vw;
`;
