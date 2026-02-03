import { IconListButton } from 'app/components/library';
import { useModalToggle } from 'app/root/hooks';
import { Modals } from 'app/stores';
import { CraftIcon } from 'assets/images/icons/actions';
import { InventoryIcon, Items, TradeIcon } from 'assets/images/icons/menu';
import { ItemImages } from 'assets/images/items';
import { TokenIcons } from 'assets/images/tokens';

export const ItemsMenuButton = () => {
  const toggleModal = useModalToggle();

  const toggleInventory = () => {
    const hideModals: Partial<Modals> = {
      chat: false,
      help: false,
      quests: false,
      settings: false,
      questDialogue: false,
      dialogue: false,
      kami: false,
    };
    toggleModal('inventory', hideModals);
  };

  const toggleCrafting = () => {
    const hideModals: Partial<Modals> = {
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
    toggleModal('crafting', hideModals);
  };

  const toggleTokenPortal = () => {
    const hideModals: Partial<Modals> = {
      crafting: false,
      node: false,
      kami: false,
    };
    toggleModal('tokenPortal', hideModals);
  };

  const toggleOrderbook = () => {
    const hideModals: Partial<Modals> = {
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
    toggleModal('trading', hideModals);
  };

  const toggleObol = () => {
    const hideModals: Partial<Modals> = {
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
    toggleModal('lootBox', hideModals);
  };

  return (
    <IconListButton
      img={Items}
      options={[
        { text: 'Inventory', image: InventoryIcon, onClick: toggleInventory },
        { text: 'Craft', image: CraftIcon, onClick: toggleCrafting },
        { text: 'Trade', image: TradeIcon, onClick: toggleOrderbook },
        { text: 'Pop-up Shop', image: ItemImages.obol, onClick: toggleObol },
        { text: 'Token Portal', image: TokenIcons.onyx, onClick: toggleTokenPortal },
      ]}
      tooltip={{ text: ['Items'] }}
      menuButton={true}
    />
  );
};
