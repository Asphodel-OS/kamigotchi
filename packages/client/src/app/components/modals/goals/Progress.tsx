import { EntityIndex } from 'engine/recs';
import styled from 'styled-components';

import { formatFull, Palette } from 'app/components/library/pastel';
import { Account } from 'network/shapes/Account';
import { Contribution, Goal } from 'network/shapes/Goals';
import { DetailedEntity } from 'network/shapes/utils';
import { ActionBar } from './ActionBar';
import { ProgressBar } from './ProgressBar';

// pinned footer: shared progress, your standing, and the contribute/claim action
export const Progress = ({
  actions,
  account,
  goal,
  accContribution,
  unit,
  utils,
}: {
  actions: {
    contributeTx: (goal: Goal, amount: number) => void;
    claimTx: (goal: Goal) => void;
  };
  account: Account;
  accContribution: Contribution | undefined;
  goal: Goal;
  unit: string;
  utils: {
    canContribute: () => [boolean, string];
    canClaim: () => [boolean, string];
    getBalance: (holder: EntityIndex, index: number | undefined, type: string) => number;
    getFromDescription: (type: string, index: number) => DetailedEntity;
  };
}) => {
  const max = Number(goal.objective.target.value ?? 0);
  const current = Number(goal.currBalance);
  const mine = Number(accContribution?.value ?? 0);

  const tiers = goal.tiers
    .filter((t) => Number(t.cutoff) > 0)
    .sort((a, b) => Number(a.cutoff) - Number(b.cutoff));
  const reached = [...tiers].reverse().find((t) => mine >= Number(t.cutoff));
  const next = tiers.find((t) => mine < Number(t.cutoff));

  const standing = () => {
    if (mine === 0)
      return next ? `Contribute ${formatFull(next.cutoff)} ${unit} for ${next.name}` : '';
    const parts = [`You've given ${formatFull(mine)} ${unit}`];
    if (reached) parts.push(`${reached.name} reached`);
    if (next && !goal.complete)
      parts.push(`${formatFull(Number(next.cutoff) - mine)} more for ${next.name}`);
    return parts.join(' · ');
  };

  return (
    <Footer>
      <Left>
        <Row>
          <Label>{goal.complete ? 'Complete' : 'Progress'}</Label>
          <Amount>
            {formatFull(current)} / {formatFull(max)} {unit}
          </Amount>
        </Row>
        <ProgressBar max={max} current={current} />
        <Standing>{standing()}</Standing>
      </Left>
      <ActionBar
        actions={actions}
        account={account}
        goal={goal}
        accContribution={accContribution}
        unit={unit}
        utils={utils}
      />
    </Footer>
  );
};

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.4vw;
  padding: 0.9vw 1.4vw;
  background: ${Palette.soft};
`;

const Left = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.45vw;
  min-width: 0;
`;

const Row = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1vw;
`;

const Label = styled.span`
  font-family: Pixel;
  font-size: 0.8vw;
  color: ${Palette.ink};
`;

const Amount = styled.span`
  font-family: Pixel;
  font-size: 0.68vw;
  color: ${Palette.muted};
  font-variant-numeric: tabular-nums;
`;

const Standing = styled.span`
  font-family: Pixel;
  font-size: 0.6vw;
  color: ${Palette.muted};
  min-height: 0.8vw;
`;
