import { IconButton, TextTooltip } from 'app/components/library';
import { useTokens, useVisibility } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';

const ONYX_ADDR = '0x4BaDFb501Ab304fF11217C44702bb9E9732E7CF4';

export const OnyxMenuButton = () => {
  const balances = useTokens((s) => s.balances);
  const portalIsOpen = useVisibility((s) => s.modals.tokenPortal);
  const setModals = useVisibility((s) => s.setModals);

  const onyxInfo = balances.get(ONYX_ADDR);
  const balance = onyxInfo?.balance ?? 0;
  const allowance = onyxInfo?.allowance ?? 0;

  return (
    <TextTooltip
      title='Token Portal'
      text={[`$ONYX Balance: ${balance.toFixed(3)}`, `$ONYX Allowance: ${allowance.toFixed(3)}`]}
    >
      <IconButton
        img={TokenIcons.onyx}
        text={balance?.toFixed(3)}
        onClick={() => setModals({ tokenPortal: !portalIsOpen })}
        scale={4.5}
        scaleOrientation='vh'
        radius={0.9}
      />
    </TextTooltip>
  );
};
