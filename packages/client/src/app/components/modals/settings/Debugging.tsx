import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { useAccount, useVisibility } from 'app/stores';

export const Debugging = ({
  actions,
}: {
  actions: {
    echoRoom: () => void;
    echoKamis: () => void;
  };
}) => {
  const { debug, setDebug } = useAccount();
  const { modals, setModals } = useVisibility();

  const toggleDebug = () => {
    setDebug({ cache: !debug.cache });
  };

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
        {FieldRow('Commits Modal', 'Open', () => setModals({ reveal: true }))}
        {FieldRow('Sync kamis', 'sync', actions.echoKamis)}
        {FieldRow('Sync location', 'sync', actions.echoRoom)}
        {FieldRow('Cache Debugging', debug.cache ? 'turn off' : 'turn on', toggleDebug)}
      </Section>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.6em;
`;

const Header = styled.div`
  color: #333;
  margin: 0.6em 0em;
  font-family: Pixel;
  font-size: 1em;
  text-align: left;
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin: 0.4em;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const SubHeader = styled.div`
  color: #333;
  padding: 0em 0.2em;
  font-family: Pixel;
  font-size: 0.75em;
  text-align: left;
`;

const Row = styled.div`
  padding: 0.75em 0.6em;

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
  gap: 0.5em;
`;

const Text = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: 0.6em;
  text-align: left;
`;
