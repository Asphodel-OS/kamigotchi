import { useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { farcasterLogo } from 'assets/images/logos';
import { Account } from 'layers/network/shapes/Account';
import { IconButton, Tooltip } from 'layers/react/components/library';
import { useAccount } from 'layers/react/store/account';
import { FarcasterUser, client, emptyFaracasterUser, handleSignIn } from 'src/clients/neynar';

interface Props {
  account: Account;
  actions: {
    connectFarcaster: (fid: number, pfpURI: string) => void;
  };
}

export const FarcasterConnect = (props: Props) => {
  const { account, actions } = props;
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

  const getColor = () => {
    if (!farcasterUser.fid) return 'orange';
    if (!account.fid) return 'blue';
    if (farcasterUser.fid !== account.fid) return 'red';
    return 'purple';
  };

  const getTooltipText = () => {
    if (!farcasterUser.fid) return ['Connect to Farcaster'];
    if (!account.fid) return ['Link Farcaster Account to Kami Account'];
    if (farcasterUser.fid !== account.fid)
      return [`fid mismatch!`, `client: ${farcasterUser.fid}`, `server: ${account.fid}`];
    return [`Connected to Farcaster`, `FID: ${farcasterUser.fid}`];
  };

  const getOnClick = () => {
    if (!farcasterUser.fid) return () => handleSignIn();
    if (!account.fid)
      return () => actions.connectFarcaster(farcasterUser.fid, farcasterUser.pfp_url);
    if (farcasterUser.fid !== account.fid)
      return () => actions.connectFarcaster(farcasterUser.fid, farcasterUser.pfp_url);
    return () => {};
  };

  return (
    <Tooltip text={getTooltipText()}>
      <IconButton size='small' img={farcasterLogo} color={getColor()} onClick={getOnClick()} />
    </Tooltip>
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
