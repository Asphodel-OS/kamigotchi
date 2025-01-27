import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { useAccount } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { ActionSystem } from 'network/systems';
import { waitForActionCompletion } from 'network/utils';
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
    setScrollDown: (scrollDown: boolean) => void;
    pushCast: (cast: CastWithInteractions) => void;
  };
  api: any;
  world: World;
}

export const InputRow = (props: Props) => {
  const { account, actionSystem, api, world } = props;
  const { setScrollDown } = props.actions;
  const [farcasterUser, _] = useLocalStorage<FarcasterUser>('farcasterUser', emptyFaracasterUser);
  const { farcaster: farcasterAccount } = useAccount(); // client side account representation in store

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [text, setText] = useState('');

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

  const onSubmit = (text: string) => {
    playScribble();
    // TODO: play success sound and update message in feed here (to succeeded)
    const actionID = uuid() as EntityID;
    actionSystem!.add({
      id: actionID,
      action: 'AccountMove',
      params: [text],
      description: `Send Message`,
      execute: async () => {
        return api.player.social.chat.send(text);
      },
    });
    return actionID;
  };

  const handleSubmit = async (text: string) => {
    if (text.length === 0) return;
    try {
      const rerollActionID = onSubmit(text);
      if (!rerollActionID) throw new Error('Sending message action failed');
      await waitForActionCompletion(
        actionSystem!.Action,
        world.entityToIndex.get(rerollActionID) as EntityIndex
      );
      setScrollDown(true);
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
      <InputBox
        placeholder='Write a message...'
        id='inputBox'
        cols={60}
        rows={5}
        onBlur={(e) => {
          setText(e.target.value);
        }}
      />
      {!isAuthorized && (
        <SendButton
          style={{ padding: `0.5vw` }}
          onClick={() => {
            handleSubmit(text);
            setText('');
            (document.getElementById('inputBox') as HTMLInputElement).value = '';
          }}
        >
          Send
        </SendButton>
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

const InputBox = styled.textarea`
  resize: none;
  padding: 0 0.6vw;
  line-height: 1.5vh;
`;

const SendButton = styled.button`
  position: absolute;
  right: 1vw;
  bottom: 1.2vh;
`;
