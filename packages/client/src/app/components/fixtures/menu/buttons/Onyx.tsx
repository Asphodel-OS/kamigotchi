import { IconButton, TextTooltip } from 'app/components/library';
import { useTokens } from 'app/stores';
import { ItemImages } from 'assets/images/items';

const ONYX_ADDR = '0x4BaDFb501Ab304fF11217C44702bb9E9732E7CF4';

export const OnyxMenuButton = () => {
  const { balances } = useTokens();

  const onyxInfo = balances.get(ONYX_ADDR);
  const balance = onyxInfo?.balance ?? 0;
  const allowance = onyxInfo?.allowance ?? 0;

  const openBaselineLink = () => {
    window.open(`https://app.baseline.markets/trade/yominet/${ONYX_ADDR}`, '_blank');
  };

  return (
    <TextTooltip
      text={[
        'Acquire more $ONYX',
        `Balance: ${balance.toFixed(3)} `,
        `Allowance: ${allowance.toFixed(3)}`,
      ]}
    >
      <IconButton
        img={ItemImages.onyx}
        text={balance?.toFixed(3)}
        onClick={openBaselineLink}
        scale={4.5}
        scaleOrientation='em'
        radius={0.9}
        cornerAlt
      />
    </TextTooltip>
  );
};
