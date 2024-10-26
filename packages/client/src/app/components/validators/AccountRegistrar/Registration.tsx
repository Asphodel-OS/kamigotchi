import { EntityID, EntityIndex } from '@mud-classic/recs';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import { useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { copy } from 'app/utils';
import { abbreviateAddress } from 'utils/address';
import { playSignup } from 'utils/sounds';
import { BackButton, Description, Row } from './shared';

type FaucetState = 'unclaimed' | 'claiming' | 'claimed';
const TOTAL_FAUCETS = 2;

interface Props {
  address: {
    isTaken: boolean; // whether owner address is taken
    selected: string;
    burner: string;
  };
  actions: {
    createAccount: (username: string) => EntityID;
  };
  utils: {
    setStep: (step: number) => void;
    queryAccountByName: (name: string) => EntityIndex | undefined;
    toggleFixtures: (toggle: boolean) => void;
    waitForActionCompletion: (action: EntityID) => Promise<void>;
  };
}

export const Registration = (props: Props) => {
  const { address, actions, utils } = props;
  const [name, setName] = useState('');
  const [faucetState, setFaucetState] = useState<FaucetState>('unclaimed');
  const [faucetSymbol, setFaucetSymbol] = useState<string>('🚰');
  const [faucetIndex, setFaucetIndex] = useState<number>(Math.floor(TOTAL_FAUCETS * Math.random()));

  const isNameTaken = () => {
    const account = utils.queryAccountByName(name);
    return !!account;
  };

  /////////////////
  // INTERACTION

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isNameTaken()) {
      handleAccountCreation(name);
    }
  };

  const handleAccountCreation = async (username: string) => {
    playSignup();
    utils.toggleFixtures(true);

    try {
      const actionID = actions.createAccount(username);
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

  const dripFaucet = async (address: string) => {
    console.log('Faucet Index', faucetIndex);
    setFaucetState('claiming');
    setFaucetSymbol('🌀');

    const response = await axios.post(
      `https://initia-faucet-0${faucetIndex + 1}.test.asphodel.io/claim`,
      { address }
    );

    if (response.status !== 200) {
      console.error('Faucet Error', response.status);
      setFaucetState('unclaimed');
      setFaucetSymbol('❌');
      setFaucetIndex((faucetIndex + 1) % TOTAL_FAUCETS);
    } else {
      setFaucetState('claimed');
      setFaucetSymbol('✅');
      // TODO: play drippiest sound known to humankind
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
        <Tooltip text={[address.burner, '(click to copy)']} align='center'>
          <Description onClick={() => copy(address.burner)}>
            Operator: {abbreviateAddress(address.burner)}
          </Description>
        </Tooltip>
        <Tooltip text={infoText} align='center'>
          <InfoIcon fontSize='small' style={{ color: '#666' }} />
        </Tooltip>
      </AddressRow>
    );
  };

  const OwnerDisplay = () => {
    return (
      <AddressRow>
        <Tooltip text={[address.selected, '(click to copy)']} align='center'>
          <Description onClick={() => copy(address.selected)}>
            Owner: {abbreviateAddress(address.selected)}
          </Description>
        </Tooltip>
      </AddressRow>
    );
  };

  const SubmitButton = () => {
    let button = (
      <ActionButton
        text='Submit'
        disabled={address.isTaken || name === '' || isNameTaken() || /\s/.test(name)}
        onClick={() => handleAccountCreation(name)}
      />
    );

    let tooltip: string[] = [];
    if (address.isTaken) tooltip = ['That Operator address is already taken.'];
    else if (name === '') tooltip = [`Name cannot be empty.`];
    else if (isNameTaken()) tooltip = ['That name is already taken.'];
    else if (/\s/.test(name)) tooltip = [`Name cannot contain whitespace.`];
    if (tooltip.length > 0) button = <Tooltip text={tooltip}>{button}</Tooltip>;

    return button;
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
        <SubmitButton />
      </Row>
      <Row>
        <BackButton step={2} setStep={utils.setStep} />
        <Tooltip text={['ONYX Faucet', `(${faucetState})`]} align='center'>
          <ActionButton
            onClick={() => dripFaucet(address.selected)}
            size='medium'
            text={`Faucet ${faucetSymbol}`}
            disabled={faucetState !== 'unclaimed'}
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
  border: solid #71f 0.1vw;
  background-color: #ddd;

  padding: 0.6vw;
  margin: 0.9vw 0 0.3vw 0;
  width: 12.5vw;

  display: inline-block;
  justify-content: center;
  cursor: text;

  font-size: 0.6vw;
  text-align: center;
  text-decoration: none;
`;
