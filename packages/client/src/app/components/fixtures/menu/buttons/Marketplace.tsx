import { IconListButton } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { KamiSendIcon, LpFountainIcon, ObolShopIcon, TradeIcon } from 'assets/images/icons/menu';

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
          image: KamiSendIcon,
          onClick: () => setModals({ ...modals, kamiSend: !modals.kamiSend }),
        },
        {
          text: 'Obol Pop-Up Shop!',
          image: ObolShopIcon,
          onClick: () => setModals({ ...modals, lootBox: !modals.lootBox }),
        },
        {
          text: 'Item Pools',
          image: LpFountainIcon,
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
