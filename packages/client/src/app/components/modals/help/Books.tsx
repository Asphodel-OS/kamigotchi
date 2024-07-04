import { HelpMenuIcons } from 'assets/images/help';
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
      <Book
        key={1}
        img={HelpMenuIcons.starting}
        title='Kamigotchi World'
        onClick={() => setTab(HelpTabs.START)}
      />
      <Book
        key={2}
        img={HelpMenuIcons.kamis}
        title='On Kamigotchi'
        onClick={() => setTab(HelpTabs.KAMIS)}
      />
      <Book
        key={3}
        img={HelpMenuIcons.nodes}
        title='Harvesting'
        onClick={() => setTab(HelpTabs.NODES)}
      />
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
