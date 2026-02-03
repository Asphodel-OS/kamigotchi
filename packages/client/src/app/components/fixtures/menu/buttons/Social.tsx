import { IconListButton } from 'app/components/library';
import { useIsMobile } from 'app/root/hooks';
import { Modals, useAccount, useSelected, useVisibility } from 'app/stores';
import { KamiIcon, OperatorIcon, QuestsIcon, Social2 } from 'assets/images/icons/menu';

export const SocialMenuButton = () => {
  const setModals = useVisibility((s) => s.setModals);
  const setAccount = useSelected((s) => s.setAccount);
  const accountIndex = useAccount((s) => s.account.index);
  const isMobile = useIsMobile();

  const manageMobile = (targetModal: keyof Modals, hideModals: Partial<Modals>) => {
    const { modals } = useVisibility.getState();
    const isModalOpen = modals[targetModal];
    let nextModals: Partial<Modals> = { [targetModal]: !isModalOpen };
    if (!isModalOpen) {
      if (isMobile) {
        const { modals } = useVisibility.getState();
        const allClosed = Object.fromEntries(Object.keys(modals).map((key) => [key, false]));
        nextModals = { ...allClosed, [targetModal]: true };
      } else {
        nextModals = { ...nextModals, ...hideModals };
      }
    }
    setModals(nextModals);
  };

  const toggleAccount = (targetModal: keyof Modals) => {
    setAccount(accountIndex);
    const modalsToHide: Partial<Modals> = {
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
    manageMobile(targetModal, modalsToHide);
  };

  const toggleParty = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      account: false,
      bridgeERC20: false,
      dialogue: false,
      kami: false,
      leaderboard: false,
      map: false,
      merchant: false,
      trading: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const toggleQuests = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      chat: false,
      help: false,
      inventory: false,
      settings: false,
      questDialogue: false,
      dialogue: false,
      kami: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  return (
    <IconListButton
      img={Social2}
      options={[
        { text: 'Account', image: OperatorIcon, onClick: () => toggleAccount('account') },
        { text: 'Party', image: KamiIcon, onClick: () => toggleParty('party') },
        { text: 'Quests', image: QuestsIcon, onClick: () => toggleQuests('quests') },
      ]}
      tooltip={{ text: ['Social'] }}
      menuButton={true}
    />
  );
};
