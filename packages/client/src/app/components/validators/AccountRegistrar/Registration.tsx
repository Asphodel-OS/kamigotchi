import InfoIcon from '@mui/icons-material/Info';
import { EntityID } from 'engine/recs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { IconButton, TextTooltip } from 'app/components/library';
import { triggerBridgeModal } from 'app/triggers';
import { useTokens } from 'app/stores';
import { copy } from 'app/utils';
import { MenuIcons } from 'assets/images/icons/menu';
import { GasConstants } from 'constants/gas';
import { NameCache, OperatorCache } from 'network/shapes/Account';
import { abbreviateAddress } from 'utils/address';
import { playSignup } from 'utils/sounds';
import { Description, Row } from './components';
import { Section } from './components/shared';

// staged username survives the multi-minute bridge wait (and reloads)
const STAGED_NAME_PREFIX = 'kami:stagedUsername:';

export const Registration = ({
  address,
  actions,
  utils,
}: {
  address: {
    selected: string;
    burner: string;
  };
  actions: {
    createAccount: (username: string) => EntityID | void;
  };
  utils: {
    toggleFixtures: (toggle: boolean) => void;
    waitForActionCompletion: (action: EntityID) => Promise<void>;
  };
}) => {
  const ethBalance = useTokens((s) => s.eth.balance);

  const storageKey = `${STAGED_NAME_PREFIX}${address.selected}`;
  const [name, setName] = useState(() => localStorage.getItem(storageKey) ?? '');
  // armed = the player staged their name during the bridge wait; the account
  // is created automatically (wallet still prompts) once ETH lands
  const [autoCreate, setAutoCreate] = useState(() => localStorage.getItem(storageKey) !== null);
  const autoFiringRef = useRef(false);

  // re-sync staged state when the selected wallet changes without a remount —
  // one wallet's staged name must never register under another wallet
  useEffect(() => {
    const staged = localStorage.getItem(storageKey);
    setName(staged ?? '');
    setAutoCreate(staged !== null);
  }, [address.selected]);

  const isNameTaken = (username: string) => {
    return NameCache.has(username);
  };

  const isOperaterTaken = (operatorAddress: string) => {
    return OperatorCache.has(operatorAddress);
  };

  const needsToBridge = () => {
    return ethBalance < GasConstants.Empty && import.meta.env.MODE !== 'development';
  };

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !getError()) {
      handleAccountCreation();
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const truncated = event.target.value.slice(0, 16);
    setName(truncated);
    if (autoCreate) localStorage.setItem(storageKey, truncated); // keep stage in sync
  };

  // stage the name and kick the bridge off — creation fires when ETH lands
  const armAutoCreate = () => {
    if (getError()) return;
    localStorage.setItem(storageKey, name);
    setAutoCreate(true);
    triggerBridgeModal();
  };

  // fire the staged creation once funds arrive (the owner wallet still
  // prompts for the signature — this just saves the player the babysitting).
  // one-shot: a rejected signature keeps the staged name (in storage) so
  // nothing is lost, but doesn't re-prompt until the player acts or reloads
  useEffect(() => {
    if (!autoCreate || autoFiringRef.current) return;
    if (needsToBridge()) return;
    if (getError()) return;
    autoFiringRef.current = true;
    setAutoCreate(false);
    handleAccountCreation().finally(() => {
      autoFiringRef.current = false;
    });
  }, [ethBalance, autoCreate, name]);

  const handleAccountCreation = async (): Promise<boolean> => {
    playSignup();
    utils.toggleFixtures(true);

    try {
      const actionID = actions.createAccount(name);
      if (!actionID) throw new Error('Account creation failed');
      await utils.waitForActionCompletion(actionID);

      // Clear stale account query caches so the AccountRegistrar's ECS query
      // picks up the freshly created account on the next render cycle.
      OperatorCache.clear();
      NameCache.clear();
      localStorage.removeItem(storageKey); // staged name no longer needed
      return true;
    } catch (e) {
      console.error('ERROR CREATING ACCOUNT:', e);
      return false;
    }
  };

  const openDocs = () => {
    window.open('https://docs.kamigotchi.io', '_blank', 'noopener,noreferrer');
  };

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
      <AddressInline>
        <TextTooltip text={[address.selected, '', '(click to copy)']} alignText='center'>
          <Description size={0.9} onClick={() => copy(address.selected)}>
            Owner: {abbreviateAddress(address.selected)}
          </Description>
        </TextTooltip>
      </AddressInline>
    );
  };

  const getError = (): string | null => {
    if (isOperaterTaken(address.burner)) return 'That Operator address is already taken.';
    if (name === '') return 'Name cannot be empty.';
    if (/\s/.test(name)) return 'Name cannot contain whitespace.';
    if (isNameTaken(name)) return 'That name is already taken.';
    return null;
  };

  if (needsToBridge()) {
    return (
      <Container>
        <BridgeFlow>
          <Section padding={0.6}>
            <Description size={0.88}>
              You need to bridge Ether to Yominet before you can play. Pick your username now — your
              account is created automatically the moment your ETH arrives.
            </Description>
            <InputActionRow>
              <Input
                type='string'
                value={name}
                onChange={(e) => handleNameChange(e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !getError() && !autoCreate) armAutoCreate();
                }}
                placeholder='choose your username'
                style={{ pointerEvents: 'auto' }}
              />
              <IconButton
                scale={2.4}
                text={autoCreate ? 'Waiting for ETH...' : 'Create once ETH arrives'}
                disabled={!!getError() || autoCreate}
                onClick={armAutoCreate}
              />
            </InputActionRow>
            <Text role='status' aria-live='polite'>
              {getError() ??
                (autoCreate
                  ? 'Name staged! Your account will be created automatically when your ETH lands.'
                  : '')}
            </Text>
            <IconButton
              scale={3}
              img={MenuIcons.kami}
              // no amount prefill — the bridge modal defaults to Zevana's
              // live price + operator gas headroom
              onClick={() => triggerBridgeModal()}
              text='Bridge ETH to Yominet'
            />
            <DocsLink type='button' onClick={openDocs}>
              What is this?
            </DocsLink>
          </Section>
        </BridgeFlow>
      </Container>
    );
  }

  return (
    <Container>
      <CreateFlow>
        <CompactSection padding={0.25}>
          <Description size={0.88}>
            This is an on-chain username, and your in-game identity. You only need to pay a tiny bit
            of gas and sign a TX....
          </Description>
        </CompactSection>
        <CompactSection padding={0.2}>
          <AddressRow>
            {OwnerDisplay()}
            {OperatorDisplay()}
          </AddressRow>
        </CompactSection>
        <InputActionRow>
          <Input
            type='string'
            value={name}
            onChange={(e) => handleNameChange(e)}
            onKeyDown={(e) => catchKeys(e)}
            placeholder='choose your username'
            style={{ pointerEvents: 'auto' }}
          />
          <IconButton
            scale={2.4}
            text='Create Account'
            disabled={!!getError()}
            onClick={() => handleAccountCreation()}
          />
        </InputActionRow>
        <Text role='status' aria-live='polite'>
          {getError() ?? ''}
        </Text>
        <DocsLink type='button' onClick={openDocs}>
          What is this?
        </DocsLink>
      </CreateFlow>
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

const BridgeFlow = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: 0.9vw;
`;

const CreateFlow = styled.div`
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: 0.2vw;
`;

const CompactSection = styled(Section)`
  width: 100%;
`;

const AddressRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.3vw;
`;

const AddressInline = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Input = styled.input`
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

const InputActionRow = styled(Row)`
  gap: 0.45vw;
`;

const Text = styled.div`
  min-height: 0.8vw;
  padding: 0.35vw 0;
  color: red;
  font-size: 0.75vw;
  text-align: center;
`;

const DocsLink = styled.button`
  margin-top: 1vw;
  border: 0;
  background: transparent;
  padding: 0;
  color: #3b4fb3;
  font-size: 0.82vw;
  text-decoration: underline;
  cursor: pointer;
`;
