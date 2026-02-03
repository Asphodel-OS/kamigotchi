import { IconButton, TextTooltip } from 'app/components/library';
import { useModalToggle } from 'app/root/hooks';
import { useTokens } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';

const ONYX_ADDR = '0x4BaDFb501Ab304fF11217C44702bb9E9732E7CF4';

export const OnyxMenuButton = () => {
  const balances = useTokens((s) => s.balances);
  const toggleModal = useModalToggle();

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
        onClick={() => toggleModal('tokenPortal')}
        radius={0.4}
      />
    </TextTooltip>
  );
};
