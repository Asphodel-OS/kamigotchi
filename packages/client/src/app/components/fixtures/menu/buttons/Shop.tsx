import { IconListButton } from 'app/components/library';
import { useModalToggle } from 'app/root/hooks';
import { Modals } from 'app/stores';
import { TradeIcon } from 'assets/images/icons/menu';
import { ItemImages } from 'assets/images/items';
import { TokenIcons } from 'assets/images/tokens';

export const ShopMenuButton = () => {
  const toggleModal = useModalToggle();

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
      img={TradeIcon}
      options={[
        { text: 'Pop-up Shop', image: ItemImages.obol, onClick: toggleObol },
        { text: 'Token Portal', image: TokenIcons.onyx, onClick: toggleTokenPortal },
        { text: 'Trade', image: TradeIcon, onClick: toggleOrderbook },
      ]}
      tooltip={{ text: ['Shop'] }}
      menuButton={true}
    />
  );
};
