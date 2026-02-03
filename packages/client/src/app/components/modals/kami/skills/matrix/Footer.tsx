import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
import { IconButton, TextTooltip } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { RESPEC_POTION_INDEX } from 'constants/items';
import { Kami } from 'network/shapes';

export const Footer = ({
  kami,
  actions,
  utils,
}: {
  kami: Kami;
  actions: {
    reset: (kami: Kami) => void;
  };
  utils: {
    getItemBalance: (index: number) => number;
    getUpgradeError: (index: number) => string[] | undefined;
    getTreePoints: (tree: string) => number;
  };
}) => {
  const { reset } = actions;
  const { getItemBalance } = utils;

  /////////////////
  // CHECKERS

  const hasRespecs = () => {
    return getItemBalance(RESPEC_POTION_INDEX) > 0;
  };

  /////////////////
  // INTERPRETATION

  const getRespecTooltip = () => {
    const tooltip = ['Unindoctrinate your kamigotchi with a Skill Respec Potion'];
    if (!hasRespecs()) tooltip.push('\nNo Respec Potions in inventory');
    if (!isResting(kami)) tooltip.push('\nKami must be resting');
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
    <StickyFooter>
      <TextTooltip text={getRespecTooltip()} maxWidth={{ desktop: 24 }}>
        <IconButton
          key='respec-button'
          onClick={() => reset(kami)}
          img={ItemImages.respec_potion}
          disabled={!isResting(kami) || !hasRespecs()}
        />
      </TextTooltip>
      <Points>{getPointsText()}</Points>
    </StickyFooter>
  );
};

const StickyFooter = styled.div`
  position: sticky;
  bottom: 2%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 0.3em;
  z-index: 1;
  height: 100%;
`;

const Points = styled.div`
  background-color: #ffffff;
  border: solid black 0.15em;
  border-radius: 0.45em;

  width: 7.5em;

  color: black;
  font-size: 0.9em;
  line-height: 1.35em;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;
