import styled from "styled-components"


import { ActionButton } from "layers/react/components/library/ActionButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { dataStore } from "layers/react/store/createStore";
import { useKamiAccount } from "layers/react/store/kamiAccount";
import CopyButton from "../../library/CopyButton";


interface Props {
  setStatus: (text: string) => void;
}

export const Account = (props: Props) => {
  const { details: accountDetails } = useKamiAccount();
  const { visibleModals, setVisibleModals } = dataStore();

  const truncateAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    props.setStatus('Copied to clipboard!');
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
      <Header>Account ({accountDetails.name})</Header>
      <Section key='owner'>
        <SubHeaderRow>
          <SubHeader>Owner</SubHeader>
        </SubHeaderRow>
        {FieldRow('Address', accountDetails.ownerAddress)}
      </Section>
      <Section key='operator'>
        <SubHeaderRow>
          <SubHeader>Operator</SubHeader>
          <Tooltip text={['update']}>
            <ActionButton
              id='update-button'
              text='update'
              onClick={() => setVisibleModals({ ...visibleModals, operatorUpdater: true })}
              size='small'
            />
          </Tooltip>
          <Tooltip text={['fund']}>
            <ActionButton
              id='fund-button'
              text='fund'
              onClick={() => setVisibleModals({ ...visibleModals, operatorFund: true })}
              size='small'
            />
          </Tooltip>
        </SubHeaderRow>
        {FieldRow('Address', accountDetails.operatorAddress)}
        {FieldRow('Private Key', localStorage.getItem("operatorPrivateKey") || '')}
      </Section>
    </Container>
  );
}


const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: .6vw;
`;

const Header = styled.div`
  font-size: 1vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
  margin: .6vw 0vw;
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin: .4vw;
`;

const SubHeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const SubHeader = styled.div`
  font-size: .8vw;
  color: #333;
  padding: 0vw .2vw;
  text-align: left;
  font-family: Pixel;
`;

const Row = styled.div`
  padding: .3vw 0vw .3vw .4vw;

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
  gap: .5vw;
`;

const Text = styled.p`
  color: #333;
  font-family: Pixel;
  font-size: .6vw;
  text-align: left;
`;
