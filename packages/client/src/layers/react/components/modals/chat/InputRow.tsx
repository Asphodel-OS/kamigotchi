import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { Account } from 'layers/network/shapes/Account';
import { FarcasterConnect, InputSingleTextForm } from 'layers/react/components/library';
import { FarcasterUser, emptyFaracasterUser } from 'src/clients/neynar';

interface Props {
  account: Account;
}

export const InputRow = (props: Props) => {
  const { account } = props;
  const [farcasterUser, _] = useLocalStorage<FarcasterUser>('farcasterUser', emptyFaracasterUser);

  const isAuthenticated = () => {
    const isValidated = farcasterUser.fid != 0 && farcasterUser.signer_uuid !== '';
    const isMatched = account.fid == farcasterUser.fid;
    return isValidated && isMatched;
  };

  return (
    <Container>
      <InputSingleTextForm
        fullWidth
        hasButton={isAuthenticated()}
        placeholder='Cast to /Kamigotchi'
      />
      {!isAuthenticated() && <FarcasterConnect account={account} size='medium' />}
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
