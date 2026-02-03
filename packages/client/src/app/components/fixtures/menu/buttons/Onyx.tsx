import { IconButton, TextTooltip } from 'app/components/library';
import { useIsMobile, useIsPortrait, getPortraitCollidingModals } from 'app/root/hooks';
import { Modals, useTokens, useVisibility } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';

const ONYX_ADDR = '0x4BaDFb501Ab304fF11217C44702bb9E9732E7CF4';

export const OnyxMenuButton = () => {
  const balances = useTokens((s) => s.balances);
  const portalIsOpen = useVisibility((s) => s.modals.tokenPortal);
  const setModals = useVisibility((s) => s.setModals);
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();

  const onyxInfo = balances.get(ONYX_ADDR);
  const balance = onyxInfo?.balance ?? 0;
  const allowance = onyxInfo?.allowance ?? 0;

  const handleClick = () => {
    const { modals } = useVisibility.getState();
    let nextModals: Partial<Modals> = { tokenPortal: !portalIsOpen };
    if (!portalIsOpen) {
      if (isMobile) {
        const allClosed = Object.fromEntries(Object.keys(modals).map((key) => [key, false]));
        nextModals = { ...allClosed, tokenPortal: true };
      } else if (isPortrait) {
        const collidingModals = getPortraitCollidingModals('tokenPortal');
        nextModals = { ...nextModals, ...collidingModals };
      }
    }
    setModals(nextModals);
  };

  return (
    <TextTooltip
      title='Token Portal'
      text={[`$ONYX Balance: ${balance.toFixed(3)}`, `$ONYX Allowance: ${allowance.toFixed(3)}`]}
    >
      <IconButton
        img={TokenIcons.onyx}
        text={balance?.toFixed(3)}
        onClick={handleClick}
        radius={0.4}
      />
    </TextTooltip>
  );
};
