import { EntityID } from '@mud-classic/recs';
import InfoIcon from '@mui/icons-material/Info';
import { useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { copy } from 'app/utils';
import { NameCache, OperatorCache } from 'network/shapes/Account';
import { abbreviateAddress } from 'utils/address';
import { playSignup } from 'utils/sounds';
import { BackButton, Description, Row } from './components';

interface Props {
  address: {
    selected: string;
    burner: string;
  };
  actions: {
    createAccount: (username: string) => EntityID | void;
  };
  utils: {
    setStep: (step: number) => void;
    toggleFixtures: (toggle: boolean) => void;
    waitForActionCompletion: (action: EntityID) => Promise<void>;
  };
}

export const Registration = (props: Props) => {
  const { address, actions, utils } = props;
  const [name, setName] = useState('');

  const isNameTaken = (username: string) => {
    return NameCache.has(username);
  };

  const isOperaterTaken = (address: string) => {
    return OperatorCache.has(address);
  };

  /////////////////
  // INTERACTION

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isNameTaken(name)) {
      handleAccountCreation();
    }
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

  const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const truncated = event.target.value.slice(0, 16);
    setName(truncated);
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
        <Tooltip text={[address.burner, '(click to copy)']} alignText='center'>
          <Description onClick={() => copy(address.burner)}>
            Operator: {abbreviateAddress(address.burner)}
          </Description>
        </Tooltip>
        <Tooltip text={infoText} alignText='center'>
          <InfoIcon fontSize='small' style={{ color: '#666' }} />
        </Tooltip>
      </AddressRow>
    );
  };

  const OwnerDisplay = () => {
    return (
      <AddressRow>
        <Tooltip text={[address.selected, '(click to copy)']} alignText='center'>
          <Description onClick={() => copy(address.selected)}>
            Owner: {abbreviateAddress(address.selected)}
          </Description>
        </Tooltip>
      </AddressRow>
    );
  };

  const getSubmitTooltip = () => {
    if (isOperaterTaken(address.burner)) return 'That Operator address is already taken.';
    else if (isNameTaken(name)) return 'That name is already taken.';
    else if (name === '') return `Name cannot be empty.`;
    else if (/\s/.test(name)) return `Name cannot contain whitespace.`;
    return 'Register';
  };

  return (
    <>
      {OwnerDisplay()}
      {OperatorDisplay()}
      <Row>
        <Input
          type='string'
          value={name}
          onChange={(e) => handleChangeName(e)}
          onKeyDown={(e) => catchKeys(e)}
          placeholder='your username'
          style={{ pointerEvents: 'auto' }}
        />
      </Row>
      <Row>
        <BackButton step={2} setStep={utils.setStep} />{' '}
        <Tooltip text={[getSubmitTooltip()]}>
          <ActionButton
            text='Next ⟶'
            disabled={getSubmitTooltip() !== 'Register'}
            onClick={() => handleAccountCreation()}
          />
        </Tooltip>
      </Row>
    </>
  );
};

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
