import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { CopyButton } from 'layers/react/components/library/CopyButton';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { useVisibility } from 'layers/react/store/visibility';
import { useAccount } from 'layers/react/store/account';

export const Account = () => {
  const { account: kamiAccount } = useAccount();
  const { modals, setModals } = useVisibility();

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return address.slice(0, 6) + '...' + address.slice(-4);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const FieldRow = (label: string, value: string) => {
    return (
      <Row>
        <Text>{label}</Text>
        <RowContent>
          <Tooltip text={[value]}>
            <Text>{truncateAddress(value)}</Text>
          </Tooltip>
          <Tooltip text={['copy']}>
            <CopyButton onClick={() => copyText(value)}></CopyButton>
          </Tooltip>
        </RowContent>
      </Row>
    );
  };

  return (
    <Container>
      <Header>Account ({kamiAccount.name})</Header>
      <Section key='owner'>
        <SubHeaderRow>
          <SubHeader>Owner</SubHeader>
        </SubHeaderRow>
        {FieldRow('Address', kamiAccount.ownerAddress)}
      </Section>
      <Section key='operator'>
        <SubHeaderRow>
          <SubHeader>Operator</SubHeader>
          <Tooltip text={['update']}>
            <ActionButton
              id='update-button'
              text='update'
              onClick={() => setModals({ ...modals, accountOperator: true })}
              size='small'
            />
          </Tooltip>
          <Tooltip text={['fund']}>
            <ActionButton
              id='fund-button'
              text='fund'
              onClick={() => setModals({ ...modals, operatorFund: true })}
              size='small'
            />
          </Tooltip>
        </SubHeaderRow>
        {FieldRow('Address', kamiAccount.operatorAddress)}
        {FieldRow(
          'Private Key',
          localStorage.getItem('operatorPrivateKey') || ''
        )}
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
  font-size: 1vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
  margin: 0.6vw 0vw;
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin: 0.4vw;
`;

const SubHeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const SubHeader = styled.div`
  font-size: 0.8vw;
  color: #333;
  padding: 0vw 0.2vw;
  text-align: left;
  font-family: Pixel;
`;

const Row = styled.div`
  padding: 0.3vw 0vw 0.3vw 0.4vw;

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

const Text = styled.p`
  color: #333;
  font-family: Pixel;
  font-size: 0.6vw;
  text-align: left;
`;
