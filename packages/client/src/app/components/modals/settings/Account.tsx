import { usePrivy } from '@privy-io/react-auth';
import styled from 'styled-components';

import { ActionButton, CopyButton, TextTooltip } from 'app/components/library';
import { useAccount, useVisibility } from 'app/stores';
import { abbreviateAddress } from 'utils/address';

export const Account = () => {
  const { account: kamiAccount } = useAccount();
  const setModals = useVisibility((s) => s.setModals);
  const { exportWallet } = usePrivy();

  const FieldRow = (label: string, value: string) => {
    return (
      <Row>
        <Text>{label}</Text>
        <RowContent>
          <TextTooltip text={[value]}>
            <Text>{abbreviateAddress(value)}</Text>
          </TextTooltip>
          <TextTooltip text={['copy']}>
            <CopyButton text={value} />
          </TextTooltip>
        </RowContent>
      </Row>
    );
  };

  return (
    <Container>
      <HeaderRow>
        <Header>Account ({kamiAccount.name})</Header>
        <TextTooltip text={['fund account operator']}>
          <ActionButton
            text='fund'
            onClick={() => setModals({ operatorFund: true })}
            size='small'
          />
        </TextTooltip>
      </HeaderRow>
      <Section key='owner'>
        <SubHeader>Owner (Injected Wallet)</SubHeader>
        {FieldRow('Address', kamiAccount.ownerAddress)}
      </Section>
      <Section key='operator'>
        <SubHeader>Operator (Embedded Wallet)</SubHeader>
        {FieldRow('Address', kamiAccount.operatorAddress)}
        <Row>
          <Text>Private Key</Text>
          <ActionButton text='Export' onClick={() => exportWallet()} size='small' />
        </Row>
      </Section>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 0.6rem;
`;

const Header = styled.div`
  color: #333;
  margin: 0.6rem 0rem;
  font-family: Pixel;
  font-size: 1rem;
  text-align: left;
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin: 0.4rem;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const SubHeader = styled.div`
  color: #333;
  padding: 0rem 0.2rem;
  font-family: Pixel;
  font-size: 0.75rem;
  text-align: left;
`;

const Row = styled.div`
  padding: 0.75rem 0.6rem;

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
  gap: 0.5rem;
`;

const Text = styled.div`
  color: #333;
  font-family: Pixel;
  font-size: 0.6rem;
  text-align: left;
`;
