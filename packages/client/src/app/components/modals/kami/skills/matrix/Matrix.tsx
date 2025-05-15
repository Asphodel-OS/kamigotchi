import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconButton, Tooltip } from 'app/components/library';
import { OnyxButton } from 'app/components/library/buttons/actions';
import { useTokens } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { RESPEC_POTION_INDEX } from 'constants/items';
import { ONYX_RESPEC_PRICE } from 'constants/prices';
import { SkillTrees, TierRequirements } from 'constants/skills/trees';
import { Kami } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill';
import { Menu } from './Menu';
import { Node } from './Node';

interface Props {
  kami: Kami;
  setDisplayed: (skillIndex: number) => void;
  actions: {
    reset: (kami: Kami) => void;
    onyxApprove: (price: number) => void;
    onyxRespec: (kami: Kami) => void;
  };
  utils: {
    getItemBalance: (index: number) => number;
    getSkill: (index: number) => Skill;
    getUpgradeError: (index: number) => string[] | undefined;
    getTreePoints: (tree: string) => number;
  };
}

// TODO: deprecate use of TierRequirements constant
export const Matrix = (props: Props) => {
  const { kami, setDisplayed, actions, utils } = props;
  const { reset, onyxApprove, onyxRespec } = actions;
  const { getItemBalance, getSkill } = utils;

  const [mode, setMode] = useState('Predator');
  const { onyx } = useTokens();

  // whenever the tree mode changes assign the skill at root node
  useEffect(() => {
    const rootNode = SkillTrees.get(mode)![0][0];
    setDisplayed(rootNode);
  }, [mode]);

  /////////////////
  // INTERPRETATION

  const isResting = () => {
    return kami.state === 'RESTING';
  };

  const enoughBalance = () => {
    return getItemBalance(RESPEC_POTION_INDEX) > 0;
  };

  const getOnyxTooltip = () => {
    let tooltip: string[] = [
      `With some ONYX, even old Kamigotchis can learn new tricks.`,
      `Use to respec a Kami's skills`,
      `\n`,
    ];

    if (!isResting()) {
      tooltip = tooltip.concat([`Kami must be resting`]);
    } else if (onyx.balance < ONYX_RESPEC_PRICE) {
      tooltip = tooltip.concat([
        `you only have ${onyx.balance} $ONYX`,
        `you need ${ONYX_RESPEC_PRICE} $ONYX`,
      ]);
    } else if (onyx.allowance < ONYX_RESPEC_PRICE) {
      tooltip = tooltip.concat([`approve spend of ${ONYX_RESPEC_PRICE} $ONYX`]);
    } else {
      tooltip = tooltip.concat([`respec ${kami.name} with ${ONYX_RESPEC_PRICE} onyx`]);
    }
    return tooltip;
  };

  // get the text for the skill points display
  const getPointsText = () => {
    const points = kami.skills?.points;
    if (points === undefined) return '?? points';
    if (points == 1) return '1 point';
    else return `${points} points`;
  };

  ////////////////////
  // DISPLAY

  const RespecButton = () => {
    const tooltipText = ['Unindoctrinate your kamigotchi with a Skill Respec Potion'];
    if (!isResting()) tooltipText.push('\nKami must be resting');
    else if (!enoughBalance()) tooltipText.push('\nNo Respec Potions in inventory');

    return (
      <Tooltip text={tooltipText}>
        <IconButton
          key='respec-button'
          onClick={() => reset(kami)}
          img={ItemImages.respec_potion}
          disabled={!isResting() || !enoughBalance()}
        />
      </Tooltip>
    );
  };

  const OnyxRespecButton = () => {
    return (
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
        disabled={!isResting()}
      />
    );
  };

  const FloatingBox = (
    <FloatBox>
      <div style={{ display: 'flex', flexFlow: 'row', gap: '0.4vw' }}>
        {RespecButton()}
        {OnyxRespecButton()}
      </div>
      <PointsText>{getPointsText()}</PointsText>
    </FloatBox>
  );

  const NodeBox = (index: number) => {
    return (
      <Node
        key={index}
        index={index}
        kami={kami}
        skill={getSkill(index)}
        upgradeError={utils.getUpgradeError(index)}
        setDisplayed={() => setDisplayed(index)}
      />
    );
  };

  const RowLabel = (tier: number) => {
    return (
      <RowPrefix>
        <Tooltip text={[`unlock with ${TierRequirements[tier]} points`, `in ${mode} tree`]}>
          <RowNumber>{tier}</RowNumber>
        </Tooltip>
      </RowPrefix>
    );
  };

  return (
    <Container>
      <Menu options={Array.from(SkillTrees.keys())} mode={mode} setMode={setMode} />
      <Content>
        {SkillTrees.get(mode)!.map((row, i) => {
          const tier = i + 1;
          const locked = utils.getTreePoints(mode) < TierRequirements[tier];
          return (
            <Row key={tier} locked={locked}>
              {RowLabel(tier)}
              {row.map((index) => NodeBox(index))}
            </Row>
          );
        })}
        {FloatingBox}
      </Content>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  user-select: none;
`;

const Content = styled.div`
  padding: 3vw 0vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  overflow-y: auto;
`;

const Row = styled.div<{ locked: boolean }>`
  position: relative;
  border-bottom: solid black 0.15vw;
  padding: 1.2vw 3vw;

  display: flex;
  flex-flow: row;
  justify-content: space-evenly;
  align-items: center;

  background-color: ${({ locked }) => (locked ? '#ddd' : '#fff')};
`;

const RowPrefix = styled.div`
  position: absolute;
  left: 2vw;
`;

const RowNumber = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 1.2vw;
`;

const FloatBox = styled.div`
  position: absolute;
  bottom: 0.8vw;
  right: 0.8vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 0.4vw;
`;

const PointsText = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.45vw;
  background-color: #ffffff;
  padding: 0.4vw 0.6vw;
  height: 2.1vw;

  color: black;
  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
`;
