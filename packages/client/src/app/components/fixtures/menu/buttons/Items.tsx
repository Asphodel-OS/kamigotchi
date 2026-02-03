import { IconListButton } from 'app/components/library';
import { useIsMobile, useIsPortrait, getPortraitCollidingModals } from 'app/root/hooks';
import { Modals, useVisibility } from 'app/stores';
import { CraftIcon } from 'assets/images/icons/actions';
import { InventoryIcon, Items, TradeIcon } from 'assets/images/icons/menu';
import { ItemImages } from 'assets/images/items';
import { TokenIcons } from 'assets/images/tokens';

export const ItemsMenuButton = () => {
  const setModals = useVisibility((s) => s.setModals);
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();

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

  const toggleInventory = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      chat: false,
      help: false,
      quests: false,
      settings: false,
      questDialogue: false,
      dialogue: false,
      kami: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const toggleCrafting = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      bridgeERC20: false,
      bridgeERC721: false,
      dialogue: false,
      emaBoard: false,
      kami: false,
      leaderboard: false,
      node: false,
      tokenPortal: false,
      presale: false,
      trading: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const toggleTokenPortal = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      crafting: false,
      node: false,
      kami: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const toggleOrderbook = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      account: false,
      bridgeERC20: false,
      dialogue: false,
      kami: false,
      leaderboard: false,
      map: false,
      merchant: false,
      party: false,
      goal: false,
      crafting: false,
      bridgeERC721: false,
      gacha: false,
      emaBoard: false,
      presale: false,
      tokenPortal: false,
      node: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  const toggleObol = (targetModal: keyof Modals) => {
    const modalsToHide: Partial<Modals> = {
      goal: false,
      crafting: false,
      bridgeERC20: false,
      bridgeERC721: false,
      dialogue: false,
      kami: false,
      gacha: false,
      emaBoard: false,
      presale: false,
      tokenPortal: false,
      trading: false,
      node: false,
    };
    manageMobile(targetModal, modalsToHide);
  };

  return (
    <IconListButton
      img={Items}
      options={[
        {
          text: 'Inventory',
          image: InventoryIcon,
          onClick: () => toggleInventory('inventory'),
        },
        { text: 'Craft', image: CraftIcon, onClick: () => toggleCrafting('crafting') },
        {
          text: 'Trade',
          image: TradeIcon,
          onClick: () => toggleOrderbook('trading'),
        },
        {
          text: 'Pop-up Shop',
          image: ItemImages.obol,
          onClick: () => toggleObol('lootBox'),
        },
        {
          text: 'Token Portal',
          image: TokenIcons.onyx,
          onClick: () => toggleTokenPortal('tokenPortal'),
        },
      ]}
      tooltip={{ text: ['Items'] }}
      menuButton={true}
    />
  );
};
