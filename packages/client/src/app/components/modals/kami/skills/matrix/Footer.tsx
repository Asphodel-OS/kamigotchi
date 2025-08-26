import { EntityID } from '@mud-classic/recs';
import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
import { IconButton, Overlay, TextTooltip } from 'app/components/library';
import { OnyxButton } from 'app/components/library/buttons/actions';
import { useTokens } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { RESPEC_POTION_INDEX } from 'constants/items';
import { ONYX_RESPEC_PRICE } from 'constants/prices';
import { Kami } from 'network/shapes';

export const Footer = ({
  kami,
  actions,
  utils,
}: {
  kami: Kami;
  actions: {
    reset: (kami: Kami) => void;
    onyxApprove: (price: number) => EntityID | void;
    onyxRespec: (kami: Kami) => EntityID | void;
  };
  utils: {
    getItemBalance: (index: number) => number;
    getUpgradeError: (index: number) => string[] | undefined;
    getTreePoints: (tree: string) => number;
  };
}) => {
  const { reset, onyxApprove, onyxRespec } = actions;
  const { getItemBalance } = utils;

  const { onyx } = useTokens();

  /////////////////
  // CHECKERS

  const hasRespecs = () => {
    return getItemBalance(RESPEC_POTION_INDEX) > 0;
  };

  const hasOnyx = () => {
    return onyx.balance >= ONYX_RESPEC_PRICE;
  };

  /////////////////
  // INTERPRETATION

  const getRespecTooltip = () => {
    const tooltip = ['Unindoctrinate your kamigotchi with a Skill Respec Potion'];
    if (!hasRespecs()) tooltip.push('\nNo Respec Potions in inventory');
    if (!isResting(kami)) tooltip.push('\nKami must be resting');
    return tooltip;
  };

  const getOnyxTooltip = () => {
    const tooltip: string[] = [
      `With the power of ONYX,`,
      `even old Kamis can learn new tricks.`,
      ` (Cost: ${ONYX_RESPEC_PRICE} ONYX)`,
      `\n`,
    ];

    if (!isResting(kami)) tooltip.push(`Kami must be resting`);
    else if (!hasOnyx()) tooltip.push(`you only have ${onyx.balance} ONYX`);
    else if (onyx.allowance < ONYX_RESPEC_PRICE) tooltip.push(`approve spend of ONYX`);
    else tooltip.push(`respec ${kami.name} with $ONYX`);

    return tooltip;
  };

  // get the text for the skill points display
  const getPointsText = () => {
    const points = kami.skills?.points;
    if (points === undefined) return '?? points';
    if (points == 1) return '1 point';
    return `${points} points`;
  };

  /////////////////
  // RENDER

  return (
    <Overlay bottom={0.75} right={0.75} gap={0.3}>
      <TextTooltip text={getRespecTooltip()} maxWidth={24}>
        <IconButton
          key='respec-button'
          onClick={() => reset(kami)}
          img={ItemImages.respec_potion}
          disabled={!isResting(kami) || !hasRespecs()}
        />
      </TextTooltip>
      <OnyxButton
        kami={kami}
        onyx={{
          price: ONYX_RESPEC_PRICE,
          allowance: onyx.allowance,
          balance: onyx.balance,
        }}
        actions={{
          onyxApprove: () => onyxApprove(ONYX_RESPEC_PRICE),
          onyxUse: () => onyxRespec(kami),
        }}
        tooltip={getOnyxTooltip()}
        disabled={!isResting(kami) || !hasOnyx()}
      />
      <Points>{getPointsText()}</Points>
    </Overlay>
  );
};

const Points = styled.div`
  background-color: #ffffff;
  border: solid black 0.15vw;
  border-radius: 0.45vw;
  height: 2.5vw;
  width: 7.5vw;

  color: black;
  font-size: 0.9vw;
  line-height: 1.35vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;
