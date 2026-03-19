import { usePrivy } from '@privy-io/react-auth';
import styled from 'styled-components';

import { ActionButton, CopyButton, TextTooltip } from 'app/components/library';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { abbreviateAddress } from 'utils/address';

const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

export const Account = () => {
  const { account: kamiAccount } = useAccount();
  const setModals = useVisibility((s) => s.setModals);
  const { exportWallet } = usePrivy();

  // Fall back to network store addresses when account hasn't been populated yet
  const selectedAddress = useNetwork((s) => s.selectedAddress);
  const burnerAddress = useNetwork((s) => s.burnerAddress);
  const ownerAddress =
    kamiAccount.ownerAddress && kamiAccount.ownerAddress !== DEAD_ADDRESS
      ? kamiAccount.ownerAddress
      : selectedAddress;
  const operatorAddress =
    kamiAccount.operatorAddress && kamiAccount.operatorAddress !== DEAD_ADDRESS
      ? kamiAccount.operatorAddress
      : burnerAddress;

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
        {FieldRow('Address', ownerAddress)}
      </Section>
      <Section key='operator'>
        <SubHeader>Operator (Embedded Wallet)</SubHeader>
        {FieldRow('Address', operatorAddress)}
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
