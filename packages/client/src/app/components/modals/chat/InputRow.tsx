import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { FarcasterConnect, InputSingleTextForm } from 'app/components/library';
import { useAccount } from 'app/stores';
import { ChatIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { ActionSystem } from 'network/systems';
import {
  FarcasterUser,
  createEmptyCast,
  emptyFaracasterUser,
  client as neynarClient,
} from 'src/clients/neynar';
import { playScribble } from 'utils/sounds';

interface Props {
  account: Account;
  actionSystem: ActionSystem;
  actions: {
    pushCast: (cast: CastWithInteractions) => void;
  };
}

export const InputRow = (props: Props) => {
  const { account, actionSystem } = props;
  const [farcasterUser, _] = useLocalStorage<FarcasterUser>('farcasterUser', emptyFaracasterUser);
  const { farcaster: farcasterAccount } = useAccount(); // client side account representation in store

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSending, setIsSending] = useState(false);

  /////////////////
  // SUBSCRIPTION

  // check whether the client is authenticated through neynar
  useEffect(() => {
    const fAccount = farcasterAccount;
    const isAuthenticated = !!fAccount.id && !!fAccount.signer;
    setIsAuthenticated(isAuthenticated);
  }, [farcasterAccount]);

  // check whether this kami account is linked to the authenticated farcaster account
  useEffect(() => {
    const fAccount = farcasterAccount;
    const isAuthorized = isAuthenticated && fAccount.id == account.fid;
    setIsAuthorized(isAuthorized);
  }, [isAuthenticated, farcasterAccount, account.fid]);

  /////////////////
  // ACTION

  // send a message to chat
  // TODO: don't assume success here
  const sendCast = async (text: string) => {
    const fAccount = farcasterAccount;
    if (!fAccount.signer) return;
    setIsSending(true);
    const response = await neynarClient.publishCast(fAccount.signer, text, {
      channelId: 'kamigotchi',
    });

    // minimally populate a new empty cast object with response data
    const cast = createEmptyCast();
    cast.author = farcasterUser;
    cast.hash = response.hash;
    cast.text = response.text;
    props.actions.pushCast(cast);
    setIsSending(false);
  };

  /////////////////
  // INTERACTION

  const onSubmit = async (text: string) => {
    try {
      playScribble();
      await sendCast(text);
      // TODO: play success sound and update message in feed here (to succeeded)
      console.log(`submitted "${text}"`);
    } catch (e) {
      // TODO: play failure sound here and remove message from feed
      // later we want to retry it offer the option to
      console.error('error sending message', e);
    }
  };

  /////////////////
  // INTERPRETATION

  const getPlaceholder = () => {
    // console.log('getting placeholder', isAuthenticated, isAuthorized);
    if (!isAuthenticated) return 'Connect Farcaster -->';
    if (!isAuthorized) return 'Link Farcaster Account -->';
    return 'Cast to /Kamigotchi';
  };

  return (
    <Container>
      <InputSingleTextForm
        fullWidth
        maxLen={320}
        placeholder={getPlaceholder()}
        onSubmit={onSubmit}
        disabled={!isAuthorized}
        hasButton={isAuthorized}
        buttonIcon={ChatIcon}
      />
      {!isAuthorized && (
        <FarcasterConnect account={account} actionSystem={actionSystem} size={2.5} />
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6vw 0.6vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.6vw;
`;
