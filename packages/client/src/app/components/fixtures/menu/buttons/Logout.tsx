import { usePrivy } from '@privy-io/react-auth';

import { Tooltip } from 'app/components/library';
import { IconButtonHybrid } from 'app/components/library/base/buttons/IconButtonHybrid';
import { useVisibility } from 'app/stores';
import { logoutIcon } from 'assets/images/icons/actions';
import { helpIcon, settingsIcon } from 'assets/images/icons/menu';

export const LogoutMenuButton = () => {
  const { ready, authenticated, logout } = usePrivy();
  const { modals, setModals } = useVisibility();

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
      <IconButtonHybrid
        img={settingsIcon}
        options={[
          { text: 'Settings', image: settingsIcon, onClick: toggleSettings },
          { text: 'Help', image: helpIcon, onClick: toggleHelp },
          { text: 'Hard Refresh', image: helpIcon, onClick: clearCache },
          { text: 'Logout', image: logoutIcon, onClick: handleClick },
        ]}
        scale={3}
        scalesOnHeight
      />
    </Tooltip>
  );
};
