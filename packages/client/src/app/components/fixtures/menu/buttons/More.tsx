import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

import { IconListButton, Tooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { LogoutIcon } from 'assets/images/icons/actions';
import { HelpIcon, MoreIcon, ResetIcon, SettingsIcon } from 'assets/images/icons/menu';

export const MoreMenuButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const { modals, setModals } = useVisibility();
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (ready) setDisabled(!authenticated);
  }, [authenticated]);

  /////////////////
  // HANDLERS

  const handleLogout = () => {
    if (ready && authenticated) logout();
  };

  const handleHardRefresh = () => {
    clearCookies();
    clearCache();
    clearStorage();
    location.reload();
  };

  /////////////////
  // INTERACTION

  // clear all indexDBs
  const clearCache = async () => {
    const dbs = await indexedDB.databases();
    dbs.forEach((db) => {
      if (db.name) {
        const request = indexedDB.deleteDatabase(db.name);
        request.onsuccess = function (event) {
          console.log('Database deleted successfully');
        };
      }
    });
  };

  // cleares all cookies
  // TODO: move this to helper function next time we need it
  const clearCookies = () => {
    document.cookie.split(';').forEach((cookie) => {
      console.log(cookie);
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
  };

  const clearStorage = () => {
    localStorage.clear();
  };

  const toggleSettings = () => {
    if (modals.settings) setModals({ settings: false });
    else {
      setModals({
        chat: false,
        help: false,
        inventory: false,
        quests: false,
        settings: true,
        presale: false,
      });
    }
  };

  const toggleHelp = () => {
    if (modals.help) setModals({ help: false });
    else {
      setModals({
        chat: false,
        help: true,
        inventory: false,
        quests: false,
        settings: false,
        presale: false,
      });
    }
  };

  return (
    <Tooltip text={['More']}>
      <IconListButton
        img={MoreIcon}
        options={[
          { text: 'Settings', disabled, image: SettingsIcon, onClick: toggleSettings },
          { text: 'Help', image: HelpIcon, onClick: toggleHelp },
          { text: 'Hard Refresh', image: ResetIcon, onClick: handleHardRefresh },
          { text: 'Logout', disabled, image: LogoutIcon, onClick: handleLogout },
        ]}
        scale={4.5}
        radius={0.6}
        scaleOrientation='vh'
      />
    </Tooltip>
  );
};
