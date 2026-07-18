import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

import { IconListButton } from 'app/components/library';
import { triggerBridgeModal } from 'app/triggers';
import { useVisibility } from 'app/stores';
import { LogoutIcon } from 'assets/images/icons/actions';
import { HelpIcon, MoreIcon, ResetIcon, SettingsIcon } from 'assets/images/icons/menu';
import { MenuIcons } from 'assets/images/icons/menu';

export const MoreMenuButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const setModals = useVisibility((s) => s.setModals);
  const settingsVisible = useVisibility((s) => s.modals.settings);
  const helpVisible = useVisibility((s) => s.modals.help);
  // settings/help modals render beneath the registration overlay (z 3 vs 20),
  // so disable those entries while the registrar is up
  const registrarVisible = useVisibility((s) => s.validators.accountRegistrar);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (ready) setDisabled(!authenticated);
  }, [authenticated]);

  /////////////////
  // HANDLERS

  const handleLogout = () => {
    if (ready && authenticated) logout();
  };

  const handleResetState = async () => {
    clearCookies();
    await clearCache();
    clearStorage();
    location.reload();
  };;

  /////////////////
  // INTERACTION

  // clear all indexDBs
  const clearCache = async () => {
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs.map((db) => {
        if (!db.name) return Promise.resolve();
        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name!);
          request.onsuccess = () => {
            console.log(`Database ${db.name} deleted successfully`);
            resolve();
          };
          request.onerror = () => reject(request.error);
          request.onblocked = () => {
            console.warn(`Database ${db.name} deletion blocked`);
            resolve();
          };
        });
      })
    );
  };;

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
    if (settingsVisible) setModals({ settings: false });
    else {
      setModals({
        chat: false,
        help: false,
        inventory: false,
        quests: false,
        settings: true,
        trading: false,
      });
    }
  };

  const toggleHelp = () => {
    if (helpVisible) setModals({ help: false });
    else {
      setModals({
        chat: false,
        help: true,
        inventory: false,
        quests: false,
        settings: false,
        trading: false,
      });
    }
  };

  return (
    <IconListButton
      img={MoreIcon}
      options={[
        { text: 'Bridge', image: MenuIcons.kami, onClick: () => triggerBridgeModal() },
        {
          text: 'Settings',
          disabled: disabled || registrarVisible,
          image: SettingsIcon,
          onClick: toggleSettings,
        },
        { text: 'Help', disabled: registrarVisible, image: HelpIcon, onClick: toggleHelp },
        { text: 'Logout', disabled, image: LogoutIcon, onClick: handleLogout },
        { text: 'Reset State', image: ResetIcon, onClick: handleResetState },
      ]}
      scale={4.5}
      scaleOrientation='vh'
      radius={0.9}
      tooltip={{ text: ['More'] }}
    />
  );
};
