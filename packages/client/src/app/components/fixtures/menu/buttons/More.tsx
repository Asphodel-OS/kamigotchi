import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

import { IconListButton, Tooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { logoutIcon } from 'assets/images/icons/actions';
import { helpIcon, moreIcon, resetIcon, settingsIcon } from 'assets/images/icons/menu';

export const MoreMenuButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const { modals, setModals } = useVisibility();
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (ready) setDisabled(!authenticated);
  }, [authenticated]);

  const handleClick = () => {
    if (ready && authenticated) logout();
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
      });
    }
  };

  // clear any indexedDB prefixed with 'ECSCache'
  const clearCache = async () => {
    const dbs = await indexedDB.databases();
    dbs.forEach((db) => {
      if (db.name?.startsWith('ECSCache')) {
        const request = indexedDB.deleteDatabase(db.name);
        request.onsuccess = function (event) {
          console.log('Database deleted successfully');
        };
      }
    });
    location.reload();
  };

  return (
    <Tooltip text={['More']}>
      <IconListButton
        img={moreIcon}
        options={[
          { text: 'Settings', disabled, image: settingsIcon, onClick: toggleSettings },
          { text: 'Help', image: helpIcon, onClick: toggleHelp },
          { text: 'Hard Refresh', image: resetIcon, onClick: clearCache },
          { text: 'Logout', disabled, image: logoutIcon, onClick: handleClick },
        ]}
        scale={4.5}
        scaleOrientation='vh'
      />
    </Tooltip>
  );
};
