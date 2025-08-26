import { ItemImages } from 'assets/images/items';
import { Kami } from 'network/shapes/Kami';
import { TextTooltip } from '../../poppers';
import { IconButton } from '../IconButton';

export const OnyxButton = ({
  kami,
  onyx,
  actions,
  tooltip,
  disabled,
}: {
  kami: Kami;
  onyx: {
    price: number;
    allowance: number;
    balance: number;
  };
  actions: {
    onyxApprove: (price: number) => void;
    onyxUse: (kami: Kami) => void;
  };
  tooltip?: string[];
  disabled?: boolean;
}) => {
  const { onyxApprove, onyxUse } = actions;
  const { allowance, balance, price } = onyx;

  const onClick = () => {
    if (allowance < price) onyxApprove(price);
    else onyxUse(kami);
  };

  /////////////////
  // DISPLAY

  return (
    <TextTooltip text={tooltip ?? []} maxWidth={24}>
      <IconButton
        key='onyx-button'
        img={ItemImages.onyx}
        onClick={onClick}
        disabled={balance < price || disabled}
      />
    </TextTooltip>
  );
};
