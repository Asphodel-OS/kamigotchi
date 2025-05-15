import { ItemImages } from 'assets/images/items';
import { Kami } from 'network/shapes/Kami';
import { Tooltip } from '../../poppers';
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
}

export const OnyxButton = (props: Props) => {
  const { actions, kami, onyx, tooltip } = props;
  const { onyxApprove, onyxUse } = actions;
  const { allowance, balance, price } = onyx;

  const onClick = () => {
    if (allowance < price) onyxApprove(price);
    else onyxUse(kami);
  };

  /////////////////
  // INTERPRETATION

  // const getTooltip = () => {
  //   let tooltip: string[] = [`the Fortunate may resurrect`, 'their kami in other ways..', `\n`];

  //   if (balance < PRICE) {
  //     tooltip = tooltip.concat([`you only have ${balance} $ONYX`, `you need ${PRICE} $ONYX`]);
  //   } else if (allowance < PRICE) {
  //     tooltip = tooltip.concat([`approve spend of ${PRICE} $ONYX`]);
  //   } else {
  //     tooltip = tooltip.concat([`save ${kami.name} with ${PRICE} onyx`]);
  //   }
  //   return tooltip;
  // };

  /////////////////
  // DISPLAY

  return (
    <Tooltip text={tooltip ?? []}>
      <IconButton
        key='onyx-button'
        img={ItemImages.onyx}
        onClick={onClick}
        disabled={balance < price}
      />
    </Tooltip>
  );
};
