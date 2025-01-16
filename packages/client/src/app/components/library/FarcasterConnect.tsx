import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { IconButton, Tooltip } from 'app/components/library';
import { useAccount, useNetwork } from 'app/stores';
import { farcasterLogo } from 'assets/images/logos';
import { Account } from 'network/shapes/Account';
import { ActionSystem } from 'network/systems/ActionSystem';
import { FarcasterUser, emptyFaracasterUser, handleSignIn } from 'src/clients/neynar';

interface Props {
  actionSystem: ActionSystem;
  account: Account;
  size?: number;
}

// This component populates the fid / neynar signer populated in the kami
// account in Account Store with the Farcaster Account in Localstorage.
// It's a bit of a bad pattern as we may reuse this component in multple
// places. We'll fix it eventually.. pls no copy.
export const FarcasterConnect = (props: Props) => {
  const { actionSystem, account, size } = props;
  const { selectedAddress, apis } = useNetwork();
  const [fUser, _] = useLocalStorage<FarcasterUser>('farcasterUser', emptyFaracasterUser);
  const { farcaster: farcasterAccount, setFarcaster: setFarcasterAccount } = useAccount();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  /////////////////
  // SUBSCRIPTION

  // on load, copy the farcaster details from localstorage to the Kami Account in Store
  useEffect(() => {
    if (!fUser) return;
    if (farcasterAccount.id === fUser.fid) return;
    setFarcasterAccount({ id: fUser.fid, signer: fUser.signer_uuid ?? '' });
  }, [fUser]);

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

  // connect the farcaster account found in localstorage to the onchain kami account
  function connectFarcaster(fid: number, pfpURI: string) {
    const api = apis.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);

    // actionSystem.add({
    //   action: 'ConnectFarcaster',
    //   params: [fid, pfpURI],
    //   description: `Connecting to Farcaster Account ${fid}`,
    //   execute: async () => {
    //     return api.account.set.farcaster(fid, pfpURI);
    //   },
    // });
  }

  /////////////////
  // INTERACTION

  const logout = () => {
    console.log('logging out');
    localStorage.removeItem('farcasterUser');
    window.dispatchEvent(new StorageEvent('local-storage', { key: 'farcasterUser' }));
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
        scale={size ?? 2.5}
        img={farcasterLogo}
        color={getColor()}
        onClick={getOnClick()}
      />
    </Tooltip>
  );
};
