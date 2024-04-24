import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { Account } from 'layers/network/shapes/Account';
import { ActionSystem } from 'layers/network/systems';
import { FarcasterConnect, InputSingleTextForm } from 'layers/react/components/library';
import { useAccount } from 'layers/react/store';
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
  const { account: kamiAccount } = useAccount(); // client side account representation in store

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSending, setIsSending] = useState(false);

  /////////////////
  // SUBSCRIPTION

  // check whether the client is authenticated through neynar
  useEffect(() => {
    const fAccount = kamiAccount.farcaster;
    // console.log('checking authentication', fAccount.id, fAccount.signer);
    // console.log('checking authentication', !!fAccount.id, !!fAccount.signer);
    setIsAuthenticated(!!fAccount.id && !!fAccount.signer);
  }, [kamiAccount.farcaster]);

  // check whether this kami account is linked to the authenticated farcaster account
  useEffect(() => {
    const fAccount = kamiAccount.farcaster;
    // console.log('checking authorization', isAuthenticated, fAccount.id, account.fid);
    setIsAuthorized(isAuthenticated && fAccount.id == account.fid);
  }, [isAuthenticated, kamiAccount.farcaster, account.fid]);

  /////////////////
  // ACTION

  // send a message to chat
  // TODO: don't assume success here
  const sendCast = async (text: string) => {
    if (!farcasterUser.signer_uuid) return;
    setIsSending(true);
    const response = await neynarClient.publishCast(farcasterUser.signer_uuid, text, {
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
      console.log(`submitted ${text}`);
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
        hasButton={isAuthorized}
        placeholder={getPlaceholder()}
        onSubmit={onSubmit}
        disabled={!isAuthorized}
      />
      {!isAuthorized && (
        <FarcasterConnect actionSystem={actionSystem} account={account} size='medium' />
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
`;
