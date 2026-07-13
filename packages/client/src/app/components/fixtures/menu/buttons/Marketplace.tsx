import { IconListButton } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { MenuIcons, TradeIcon } from 'assets/images/icons/menu';
import { ItemImages } from 'assets/images/items';

export const TradingMenuButton = () => {
  const { modals, setModals } = useVisibility();

  return (
    <IconListButton
      img={TradeIcon}
      options={[
        {
          text: 'Kamigotchi World Order Book',
          image: TradeIcon,
          onClick: () => setModals({ ...modals, trading: !modals.trading }),
        },
        {
          text: 'KamiSend',
          image: MenuIcons.kami,
          onClick: () => setModals({ ...modals, kamiSend: !modals.kamiSend }),
        },
        {
          text: 'Obol Pop-Up Shop!',
          image: ItemImages.obol,
          onClick: () => setModals({ ...modals, lootBox: !modals.lootBox }),
        },
        {
          text: 'Item Pools',
          image: ItemImages.musu,
          onClick: () => setModals({ ...modals, pool: !modals.pool }),
        },
      ]}
      scale={4.5}
      scaleOrientation='vh'
      radius={0.9}
      tooltip={{ text: ['Trading'] }}
    />
  );
};
