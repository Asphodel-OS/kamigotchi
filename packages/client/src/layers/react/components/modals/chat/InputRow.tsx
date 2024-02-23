import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { Account } from 'layers/network/shapes/Account';
import { FarcasterConnect, InputSingleTextForm } from 'layers/react/components/library';
import { FarcasterUser, emptyFaracasterUser, client as neynarClient } from 'src/clients/neynar';

interface Props {
  account: Account;
  actions: {
    pushCast: (cast: CastWithInteractions) => void;
  };
}

export const InputRow = (props: Props) => {
  const { account } = props;
  const [farcasterUser, _] = useLocalStorage<FarcasterUser>('farcasterUser', emptyFaracasterUser);
  const [isSending, setIsSending] = useState(false);

  const isAuthenticated = () => {
    const isValidated = farcasterUser.fid != 0 && farcasterUser.signer_uuid !== '';
    const isMatched = account.fid == farcasterUser.fid;
    return isValidated && isMatched;
  };

  const onSubmit = (text: string) => {
    console.log(`submitted ${text}`);
    send(text);
  };

  return (
    <Container>
      <InputSingleTextForm
        fullWidth
        maxLen={320}
        hasButton={isAuthenticated()}
        placeholder='Cast to /Kamigotchi'
        onSubmit={onSubmit}
      />
      {!isAuthenticated() && <FarcasterConnect account={account} size='medium' />}
    </Container>
  );

  // send a message to chat
  async function send(text: string) {
    if (!farcasterUser.signer_uuid) return;
    setIsSending(true);
    const response = await neynarClient.publishCast(farcasterUser.signer_uuid, text, {
      channelId: 'kamigotchi',
    });

    // // another retarded pattern, but preferable to iterating over every damn field
    // // can't even do this because the hash in the PostCastResponseCast is not a cast hash..
    // const response2 = await neynarClient.fetchBulkCasts([response.hash]);
    // const cast = response2.result.casts[0];

    const cast: CastWithInteractions = {
      author: farcasterUser,
      hash: response.hash,
      text: response.text,
      parent_hash: '',
      parent_author: { fid: '0' },
      parent_url: '',
      embeds: [],
      timestamp: new Date(Date.now()).toISOString(),
      reactions: { likes: [], recasts: [] },
      mentioned_profiles: [],
      replies: { count: 0 },
      thread_hash: '',
    };
    props.actions.pushCast(cast);
    setIsSending(false);
  }
};

const Container = styled.div`
  padding: 0.6vw 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;
