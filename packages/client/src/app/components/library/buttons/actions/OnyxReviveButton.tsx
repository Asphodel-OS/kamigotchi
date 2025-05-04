import { ItemImages } from 'assets/images/items';
import { Kami } from 'network/shapes/Kami';
import { Tooltip } from '../../poppers';
import { IconButton } from '../IconButton';

const PRICE = 3;

interface Props {
  kami: Kami;
  onyx: {
    allowance: number;
    balance: number;
  };
  actions: {
    onyxApprove: (price: number) => void;
    onyxRevive: (kami: Kami) => void;
  };
}

export const OnyxReviveButton = (props: Props) => {
  const { actions, kami, onyx } = props;
  const { onyxApprove, onyxRevive } = actions;
  const { allowance, balance } = onyx;

  const onClick = () => {
    if (allowance < PRICE) onyxApprove(PRICE);
    else onyxRevive(kami);
  };

  /////////////////
  // INTERPRETATION

  const getTooltip = () => {
    console.log(allowance);
    let tooltip: string[] = [`the Fortunate may resurrect`, 'their kami in other ways..', `\n`];

    if (balance < PRICE) {
      tooltip = tooltip.concat([`you only have ${balance} $ONYX`, `you need ${PRICE} $ONYX`]);
    } else if (allowance < PRICE) {
      tooltip = tooltip.concat([`approve spend of ${PRICE} $ONYX`]);
    } else {
      tooltip = tooltip.concat([`save ${kami.name} with ${PRICE} onyx`]);
    }
    return tooltip;
  };

  const isDisabled = () => {
    return balance < PRICE;
  };

  /////////////////
  // DISPLAY

  return (
    <Tooltip key='onyx-revive-button' text={getTooltip()}>
      <IconButton
        key='onyx-revive-button'
        img={ItemImages.onyx}
        onClick={onClick}
        disabled={isDisabled()}
      />
    </Tooltip>
  );
};
