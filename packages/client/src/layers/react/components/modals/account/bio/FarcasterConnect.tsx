import { farcasterIcon } from 'assets/images/logos';
import { IconButton } from 'layers/react/components/library';
import { useAccount } from 'layers/react/store/account';
import { useEffect } from 'react';
import { FarcasterUser, client, emptyFaracasterUser, handleSignIn } from 'src/clients/neynar';
import { useLocalStorage } from 'usehooks-ts';

interface Props {}

export const FarcasterConnect = (props: Props) => {
  const [farcasterUser, setFarcasterUser] = useLocalStorage<FarcasterUser>(
    'farcasterUser',
    emptyFaracasterUser
  );
  const { account: kamiAccount } = useAccount();

  // update farcaster user in localstorage when the account store value changes
  useEffect(() => {
    if (kamiAccount.fid && kamiAccount.neynar_signer) {
      console.log('updating farcaster id and/or signer');
      updateFarcasterUser();
    }
  }, [kamiAccount.fid, kamiAccount.neynar_signer]);

  return (
    <IconButton
      size='small'
      img={farcasterIcon}
      backgroundColor='purple'
      onClick={() => handleSignIn()}
    />
  );

  // set the farcaster user in localstorage, based on the fid found in Account Store
  async function updateFarcasterUser() {
    const fid = kamiAccount.fid!;
    const signer_uuid = kamiAccount.neynar_signer!;
    const response = await client.fetchBulkUsers([fid], {});
    if (response.users.length > 0) {
      const user = response.users[0];
      const fUser = {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        custody_address: user.custody_address ?? '',
        pfp_url: user.pfp_url,
        signer_uuid,
      };
      console.log('setting farcaster user in localstorage', fUser);
      setFarcasterUser(fUser);
    }
  }
};
