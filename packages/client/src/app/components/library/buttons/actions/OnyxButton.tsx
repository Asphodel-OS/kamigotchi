import { ItemImages } from 'assets/images/items';
import { Kami } from 'network/shapes/Kami';
import { TextTooltip } from '../../poppers';
import { IconButton } from '../IconButton';

interface Props {
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
}

export const OnyxButton = (props: Props) => {
  const { actions, kami, onyx, tooltip, disabled } = props;
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
