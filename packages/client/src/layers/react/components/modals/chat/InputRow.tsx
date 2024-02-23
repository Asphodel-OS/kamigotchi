import { useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { Account } from 'layers/network/shapes/Account';
import { FarcasterConnect, InputSingleTextForm } from 'layers/react/components/library';
import { FarcasterUser, emptyFaracasterUser, client as neynarClient } from 'src/clients/neynar';

interface Props {
  account: Account;
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
    setIsSending(true);
    const cast = await neynarClient.publishCast(farcasterUser.signer_uuid, text, {
      channelId: 'kamigotchi',
    });
    // addCast(cast);
    console.log('cast sent', cast);
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
