import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { farcasterLogo } from 'assets/images/logos';
import { Account } from 'layers/network/shapes/Account';
import { ActionSystem } from 'layers/network/systems/ActionSystem';
import { IconButton, Tooltip } from 'layers/react/components/library';
import { useAccount, useNetwork } from 'layers/react/store';
import { FarcasterUser, client, emptyFaracasterUser, handleSignIn } from 'src/clients/neynar';

interface Props {
  actionSystem: ActionSystem;
  account: Account;
  size?: 'small' | 'medium' | 'large';
}

export const FarcasterConnect = (props: Props) => {
  const { actionSystem, account, size } = props;
  const { selectedAddress, apis } = useNetwork();
  const [fUser, setFUser] = useLocalStorage<FarcasterUser>('farcasterUser', emptyFaracasterUser);
  const { account: kamiAccount, setAccount: setKamiAccount } = useAccount();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  /////////////////
  // SUBSCRIPTION

  // check whether the client is authenticated through neynar
  useEffect(() => {
    const fAccount = kamiAccount.farcaster;
    setIsAuthenticated(!!fAccount.id && !!fAccount.signer);
  }, [kamiAccount.farcaster]);

  // check whether this kami account is linked to the authenticated farcaster account
  useEffect(() => {
    const fAccount = kamiAccount.farcaster;
    setIsAuthorized(isAuthenticated && fAccount.id == account.fid);
  }, [isAuthenticated, kamiAccount.farcaster, account.fid]);

  // update farcaster user in localstorage when the account store value changes
  useEffect(() => {
    const fAccount = kamiAccount.farcaster; // farcaster user in account store
    const isMismatched = fUser.fid != fAccount.id || fUser.signer_uuid !== fAccount.signer;
    if (isAuthenticated && isMismatched) {
      console.log('updating farcaster id and/or signer');
      updateLocalStorageFUser();
    }
  }, [kamiAccount.farcaster]);

  /////////////////
  // ACTION

  // connect the farcaster account found in localstorage to the onchain kami account
  function connectFarcaster(fid: number, pfpURI: string) {
    const api = apis.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);

    actionSystem.add({
      action: 'ConnectFarcaster',
      params: [fid, pfpURI],
      description: `Connecting to Farcaster Account ${fid}`,
      execute: async () => {
        return api.account.set.farcaster(fid, pfpURI);
      },
    });
  }

  /////////////////
  // INTERACTION

  const logout = () => {
    localStorage.removeItem('fUser');
    const neynarDetails = { id: 0, signer: '' };
    setKamiAccount({ ...kamiAccount, farcaster: neynarDetails });
  };

  /////////////////
  // INTERPRETATION

  const getColor = () => {
    if (!isAuthenticated) return 'orange';
    if (!isAuthorized) return 'blue';
    if (fUser.fid !== account.fid) return 'red';
    return 'purple';
  };

  const getTooltipText = () => {
    if (!isAuthenticated) return ['Connect to Farcaster'];
    if (!isAuthorized) return ['Link Farcaster Account to Kami Account'];
    if (fUser.fid !== account.fid)
      return [`fid mismatch!`, `client: ${fUser.fid}`, `server: ${account.fid}`];
    return [`Connected to Farcaster`, `FID: ${fUser.fid}`];
  };

  const getOnClick = () => {
    if (!isAuthenticated) return () => handleSignIn();
    if (fUser.fid !== account.fid) return () => connectFarcaster(fUser.fid, fUser.pfp_url ?? '');
    return () => logout();
  };

  /////////////////
  // RENDERING

  return (
    <Tooltip text={getTooltipText()}>
      <IconButton
        size={size ?? 'small'}
        img={farcasterLogo}
        color={getColor()}
        onClick={getOnClick()}
      />
    </Tooltip>
  );

  /////////////////
  // HELPERS

  // set the farcaster user in localstorage, based on the fid found in Account Store
  async function updateLocalStorageFUser() {
    const fid = kamiAccount.farcaster.id!;
    const signer_uuid = kamiAccount.farcaster.signer!;
    const response = await client.fetchBulkUsers([fid], {});
    if (response.users.length > 0) {
      const user = response.users[0] as FarcasterUser;
      console.log('setting farcaster user in localstorage', user);
      user.signer_uuid = signer_uuid;
      setFUser(user);
    }
  }
};
