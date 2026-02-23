import { IconListButton } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { TradeIcon } from 'assets/images/icons/menu';
import { ItemImages } from 'assets/images/items';
import { TokenIcons } from 'assets/images/tokens';

export const TradingMenuButton = () => {
  const { modals, setModals } = useVisibility();

  return (
    <IconListButton
      img={TradeIcon}
      options={[
        {
          text: 'Token Portal',
          image: TokenIcons.onyx,
          onClick: () => setModals({ ...modals, tokenPortal: !modals.tokenPortal }),
        },
        {
          text: 'Kamigotchi World Order Book',
          image: TradeIcon,
          onClick: () => setModals({ ...modals, trading: !modals.trading }),
        },
        {
          text: 'Obol Pop-Up Shop!',
          image: ItemImages.obol,
          onClick: () => setModals({ ...modals, lootBox: !modals.lootBox }),
        },
        {
          text: 'KamiSwap',
          image: TradeIcon,
          onClick: () => setModals({ ...modals, marketplace: !modals.marketplace }),
        },
      ]}
      scale={4.5}
      scaleOrientation='vh'
      radius={0.9}
      tooltip={{ text: ['Trading'] }}
    />
  );
};
