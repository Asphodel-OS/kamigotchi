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
    createAccount: (username: string) => EntityID | void;
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

    let response: any;
    try {
      response = await axios.post(
        `https://initia-faucet-0${faucetIndex + 1}.test.asphodel.io/claim`,
        {
          address,
        }
      );
    } catch (e: any) {
      console.error('Faucet Error', e.response.status, e.response.data);
      setFaucetState('unclaimed');
      setFaucetSymbol('❌');
      setFaucetIndex((faucetIndex + 1) % TOTAL_FAUCETS);
    } finally {
      if (response.status == 200) {
        setFaucetState('claimed');
        setFaucetSymbol('✅');
        // TODO: play drippiest sound known to humankind
      }
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

  const getSubmitTooltip = () => {
    if (address.isTaken) return 'That Operator address is already taken.';
    else if (name === '') return `Name cannot be empty.`;
    else if (isNameTaken()) return 'That name is already taken.';
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
        <Tooltip text={[getSubmitTooltip()]}>
          <ActionButton
            text='→'
            disabled={address.isTaken || name === '' || isNameTaken() || /\s/.test(name)}
            onClick={() => handleAccountCreation(name)}
          />
        </Tooltip>
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
