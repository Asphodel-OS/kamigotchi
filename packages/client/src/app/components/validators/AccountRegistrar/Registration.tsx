import { EntityID } from '@mud-classic/recs';
import InfoIcon from '@mui/icons-material/Info';
import { useState } from 'react';
import styled from 'styled-components';

import { ActionButton, TextTooltip } from 'app/components/library';
import { useTokens } from 'app/stores';
import { copy } from 'app/utils';
import { NameCache, OperatorCache } from 'network/shapes/Account';
import { abbreviateAddress } from 'utils/address';
import { playSignup } from 'utils/sounds';
import { BackButton, Description, Row } from './components';
import { Section } from './components/shared';

const IS_LOCAL = import.meta.env.MODE === 'puter';

export const Registration = ({
  address,
  tokens,
  actions,
  utils,
}: {
  address: {
    selected: string;
    burner: string;
  };
  tokens: {
    ethAddress: string;
  };
  actions: {
    createAccount: (username: string) => EntityID | void;
  };
  utils: {
    setStep: (step: number) => void;
    toggleFixtures: (toggle: boolean) => void;
    waitForActionCompletion: (action: EntityID) => Promise<void>;
  };
}) => {
  const { ethAddress } = tokens;
  const { balances: tokenBalances } = useTokens();

  const [name, setName] = useState('');

  /////////////////
  // VALIDATION

  const isNameTaken = (username: string) => {
    return NameCache.has(username);
  };

  const isOperaterTaken = (address: string) => {
    return OperatorCache.has(address);
  };

  const hasEth = () => {
    if (IS_LOCAL) return true; // skip eth balance check on local
    const ethBalances = tokenBalances.get(ethAddress);
    if (!ethBalances) return false;
    return ethBalances.balance > 0;
  };

  /////////////////
  // INTERACTION

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isNameTaken(name)) {
      handleAccountCreation();
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const truncated = event.target.value.slice(0, 16);
    setName(truncated);
  };

  const handleAccountCreation = async () => {
    playSignup();
    utils.toggleFixtures(true);

    try {
      const actionID = actions.createAccount(name);
      if (!actionID) throw new Error('Account creation failed');
      await utils.waitForActionCompletion(actionID);
    } catch (e) {
      console.error('ERROR CREATING ACCOUNT:', e);
    }
  };

  /////////////////
  // RENDERING

  const OperatorDisplay = () => {
    const infoText = [
      'Your account Operator (embedded wallet) is managed by Privy.',
      '',
      `It behaves like a session key. And is used to approve\
        in-game actions without the need for explicit signatures.\
        It cannot be used to authorize account level changes\
        or migrate assets in and out of your account.`,
    ];

    return (
      <AddressRow>
        <TextTooltip text={[address.burner, '', '(click to copy)']} alignText='center'>
          <Description size={0.9} onClick={() => copy(address.burner)}>
            Operator: {abbreviateAddress(address.burner)}
          </Description>
        </TextTooltip>
        <TextTooltip text={infoText} alignText='center'>
          <InfoIcon fontSize='small' style={{ color: '#666', width: '1.2vw' }} />
        </TextTooltip>
      </AddressRow>
    );
  };

  const OwnerDisplay = () => {
    return (
      <AddressRow>
        <TextTooltip text={[address.selected, '', '(click to copy)']} alignText='center'>
          <Description size={0.9} onClick={() => copy(address.selected)}>
            Owner: {abbreviateAddress(address.selected)}
          </Description>
        </TextTooltip>
      </AddressRow>
    );
  };

  const getSubmitTooltip = () => {
    if (isOperaterTaken(address.burner)) return ['That Operator address is already taken.'];
    else if (isNameTaken(name)) return ['That name is already taken.'];
    else if (name === '') return [`Name cannot be empty.`];
    else if (/\s/.test(name)) return [`Name cannot contain whitespace.`];
    else if (!hasEth())
      return [
        `You need to some ETH to register.`,
        '',
        'you can bridge some over at bridge.initia.xyz',
      ];
    return ['Register'];
  };

  return (
    <Container>
      <Section padding={0.6}>
        {OwnerDisplay()}
        {OperatorDisplay()}
      </Section>
      <Row>
        <Input
          type='string'
          value={name}
          onChange={(e) => handleNameChange(e)}
          onKeyDown={(e) => catchKeys(e)}
          placeholder='your username'
          style={{ pointerEvents: 'auto' }}
        />
      </Row>
      <Row>
        <BackButton step={2} setStep={utils.setStep} />
        <TextTooltip text={getSubmitTooltip()} alignText='center'>
          <ActionButton
            text='Next ⟶'
            disabled={getSubmitTooltip()[0] !== 'Register'} // so hacky..
            onClick={() => handleAccountCreation()}
          />
        </TextTooltip>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;

  user-select: none;
`;

export const AddressRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

export const Input = styled.input`
  border-radius: 0.45vw;
  border: solid #71f 0.15vw;
  background-color: #ddd;

  padding: 0.6vw;
  width: 18vw;
  height: 2.1vw;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: text;

  font-size: 0.75vw;
  text-align: center;
`;
