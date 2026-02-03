import { IconListButton } from 'app/components/library';
import { useModalToggle } from 'app/root/hooks';
import { Modals, useAccount, useSelected } from 'app/stores';
import { KamiIcon, OperatorIcon, QuestsIcon, Social2 } from 'assets/images/icons/menu';

export const SocialMenuButton = () => {
  const setAccount = useSelected((s) => s.setAccount);
  const accountIndex = useAccount((s) => s.account.index);
  const toggleModal = useModalToggle();

  const toggleAccount = () => {
    setAccount(accountIndex);
    const hideModals: Partial<Modals> = {
      bridgeERC20: false,
      bridgeERC721: false,
      dialogue: false,
      emaBoard: false,
      kami: false,
      leaderboard: false,
      map: false,
      merchant: false,
      party: false,
      trading: false,
    };
    toggleModal('account', hideModals);
  };

  const toggleParty = () => {
    const hideModals: Partial<Modals> = {
      account: false,
      bridgeERC20: false,
      dialogue: false,
      kami: false,
      leaderboard: false,
      map: false,
      merchant: false,
      trading: false,
    };
    toggleModal('party', hideModals);
  };

  const toggleQuests = () => {
    const hideModals: Partial<Modals> = {
      chat: false,
      help: false,
      inventory: false,
      settings: false,
      questDialogue: false,
      dialogue: false,
      kami: false,
    };
    toggleModal('quests', hideModals);
  };

  return (
    <IconListButton
      img={Social2}
      options={[
        { text: 'Account', image: OperatorIcon, onClick: toggleAccount },
        { text: 'Party', image: KamiIcon, onClick: toggleParty },
        { text: 'Quests', image: QuestsIcon, onClick: toggleQuests },
      ]}
      tooltip={{ text: ['Social'] }}
      menuButton={true}
    />
  );
};
