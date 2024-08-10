import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { useVisibility } from 'app/stores';

export const Debugging = () => {
  const { modals, setModals } = useVisibility();

  const FieldRow = (label: string, buttonText: string, onClick: () => void) => {
    return (
      <Row>
        <Text>{label}</Text>
        <RowContent>
          <ActionButton text={buttonText} onClick={onClick} size='small' />
        </RowContent>
      </Row>
    );
  };

  return (
    <Container>
      <HeaderRow>
        <Header>Testnet debugging</Header>
      </HeaderRow>
      <Section key='commits'>
        {FieldRow('Commits Modal', 'Open', () => setModals({ ...modals, reveal: true }))}
      </Section>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.6vw;
`;

const Header = styled.div`
  color: #333;
  margin: 0.6vw 0vw;
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin: 0.4vw;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const SubHeader = styled.div`
  color: #333;
  padding: 0vw 0.2vw;
  font-family: Pixel;
  font-size: 0.75vw;
  text-align: left;
`;

const Row = styled.div`
  padding: 0.75vw 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const RowContent = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5vw;
`;

const Text = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: 0.6vw;
  text-align: left;
`;
