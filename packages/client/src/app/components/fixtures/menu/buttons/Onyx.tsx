import { IconButton, TextTooltip } from 'app/components/library';
import { useTokens, useVisibility } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';
import { Tokens } from 'constants/tokens';

// menu entry for the Token Portal: both portal tokens as an overlapping pair,
// balances in the tooltip rather than on the button (like the other menu icons)
export const OnyxMenuButton = () => {
  const balances = useTokens((s) => s.balances);
  const portalIsOpen = useVisibility((s) => s.modals.tokenPortal);
  const setModals = useVisibility((s) => s.setModals);

  const onyx = balances.get(Tokens.ONYX.address) ?? { balance: 0, allowance: 0 };
  const eth = balances.get(Tokens.ETH.address) ?? { balance: 0, allowance: 0 };

  return (
    <TextTooltip
      title='Token Portal'
      text={[
        `$ONYX: ${onyx.balance.toFixed(2)} (approved ${onyx.allowance.toFixed(2)})`,
        `$ETH: ${eth.balance.toFixed(4)} (approved ${eth.allowance.toFixed(4)})`,
      ]}
    >
      <IconButton
        img={[TokenIcons.onyx, TokenIcons.eth]}
        onClick={() => setModals({ tokenPortal: !portalIsOpen })}
        scale={4.5}
        scaleOrientation='vh'
        radius={0.9}
      />
    </TextTooltip>
  );
};
