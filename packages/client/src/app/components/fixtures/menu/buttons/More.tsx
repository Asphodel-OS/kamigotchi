import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

import { IconListButton } from 'app/components/library';
import { useIsMobile, useIsPortrait, getPortraitCollidingModals } from 'app/root/hooks';
import { Modals, useVisibility } from 'app/stores';
import { LogoutIcon } from 'assets/images/icons/actions';
import {
  ExternalIcon,
  HelpIcon,
  MoreIcon,
  ResetIcon,
  SettingsIcon,
  SudoIcon,
  Whispo,
} from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { useBridgeOpener } from 'network/utils/hooks';

const KAMI_ADDR = '0x5d4376b62fa8ac16dfabe6a9861e11c33a48c677';

export const MoreMenuButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const setModals = useVisibility((s) => s.setModals);
  const openBridge = useBridgeOpener();
  const [disabled, setDisabled] = useState(true);
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();

  const openSudoLink = () => {
    window.open(`https://sudoswap.xyz/#/browse/yominet/buy/${KAMI_ADDR}`, '_blank', 'noopener');
  };
  const openKamibotsLink = () => {
    window.open(`https://www.kamibots.xyz`, '_blank', 'noopener');
  };

  const manageMobile = (targetModal: keyof Modals, hideModals: Partial<Modals>) => {
    const { modals } = useVisibility.getState();
    const isModalOpen = modals[targetModal];
    let nextModals: Partial<Modals> = { [targetModal]: !isModalOpen };
    if (!isModalOpen) {
      if (isMobile) {
        const allClosed = Object.fromEntries(Object.keys(modals).map((key) => [key, false]));
        nextModals = { ...allClosed, [targetModal]: true };
      } else if (isPortrait) {
        const collidingModals = getPortraitCollidingModals(targetModal);
        nextModals = { ...nextModals, ...collidingModals };
      } else {
        nextModals = { ...nextModals, ...hideModals };
      }
    }
    setModals(nextModals);
  };

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
  };

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

  const toggleSettings = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      chat: false,
      help: false,
      inventory: false,
      quests: false,
      settings: true,
      trading: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const toggleHelp = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      chat: false,
      help: true,
      inventory: false,
      quests: false,
      settings: false,
      trading: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const options = [
    ...(!isMobile
      ? [
          {
            text: 'External Apps',
            image: ExternalIcon,
            options: [
              { text: 'Sudoswap', image: SudoIcon, onClick: openSudoLink },
              { text: 'KamiBots', image: Whispo, onClick: openKamibotsLink },
            ],
          },
        ]
      : []),
    { text: 'Bridge', image: TokenIcons.init, onClick: openBridge },
    {
      text: 'Settings',
      disabled,
      image: SettingsIcon,
      onClick: () => toggleSettings('settings'),
    },
    { text: 'Help', image: HelpIcon, onClick: () => toggleHelp('help') },
    { text: 'Logout', disabled, image: LogoutIcon, onClick: handleLogout },
    { text: 'Reset State', image: ResetIcon, onClick: handleResetState },
  ];

  return (
    <IconListButton img={MoreIcon} options={options} radius={0.4} tooltip={{ text: ['More'] }} />
  );
};
