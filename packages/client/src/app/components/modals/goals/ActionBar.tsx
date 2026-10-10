import { EntityIndex } from 'engine/recs';
import { useState } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { formatFull, Palette } from 'app/components/library/pastel';
import { Account } from 'network/shapes/Account';
import { Contribution, Goal } from 'network/shapes/Goals';
import { DetailedEntity } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';

export const ActionBar = ({
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
  goal: Goal;
  accContribution?: Contribution;
  unit: string;
  utils: {
    canContribute: () => [boolean, string];
    canClaim: () => [boolean, string];
    getBalance: (holder: EntityIndex, index: number | undefined, type: string) => number;
    getFromDescription: (type: string, index: number) => DetailedEntity;
  };
}) => {
  const [amount, setAmount] = useState(0);

  const balance = Number(
    utils.getBalance(account.entity, goal.objective.target.index, goal.objective.target.type)
  );
  const remaining = Math.max(
    Number(goal.objective.target.value ?? 0) - Number(goal.currBalance),
    0
  );
  const maxAmt = Math.min(balance, remaining);

  const contribute = () => {
    const value = Math.min(Math.max(Math.floor(amount), 0), maxAmt);
    if (value <= 0) return;
    playClick();
    actions.contributeTx(goal, value);
  };

  const claim = () => {
    playClick();
    actions.claimTx(goal);
  };

  ////////////////////
  // DISPLAY

  const Contributor = () => {
    const [canDo, errorText] = utils.canContribute();
    const disabled = !canDo || maxAmt <= 0;
    const button = (
      <Button disabled={disabled || amount <= 0} onClick={contribute}>
        Contribute
      </Button>
    );

    return (
      <Box>
        <InputRow>
          <Input
            id='goal-contribute-amount'
            type='number'
            min={0}
            max={maxAmt}
            value={amount || ''}
            placeholder='0'
            disabled={disabled}
            onChange={(e) => setAmount(Math.min(Number(e.target.value) || 0, maxAmt))}
            onKeyDown={(e) => e.key === 'Enter' && contribute()}
          />
          {disabled ? (
            <TextTooltip text={[errorText || 'Nothing to contribute']}>{button}</TextTooltip>
          ) : (
            button
          )}
        </InputRow>
        <Note>
          You have {formatFull(balance)} {unit}
        </Note>
      </Box>
    );
  };

  const Claimer = () => {
    const [canDo, errorText] = utils.canClaim();
    const claimed = !!accContribution?.claimed;
    const button = (
      <Button disabled={!canDo || claimed} onClick={claim}>
        {claimed ? 'Claimed' : 'Claim rewards'}
      </Button>
    );

    return (
      <Box>
        {!canDo && !claimed ? <TextTooltip text={[errorText]}>{button}</TextTooltip> : button}
        <Note>{claimed ? 'Rewards collected' : 'The goal is complete'}</Note>
      </Box>
    );
  };

  return goal.complete ? Claimer() : Contributor();
};

const Box = styled.div`
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4vw;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
`;

const Input = styled.input`
  width: 7.5vw;
  height: 2.2vw;
  padding: 0 0.6vw;

  font-family: Pixel;
  font-size: 0.75vw;
  color: ${Palette.ink};
  background: ${Palette.paper};
  border: solid ${Palette.ink} 0.15vw;
  border-radius: 0.5vw;

  &:focus {
    outline: solid ${Palette.progress.edge} 0.12vw;
  }
  &:disabled {
    background: ${Palette.button.disabled};
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const pillBase = `
  font-family: Pixel;
  color: ${Palette.ink};
  border: solid ${Palette.ink} 0.15vw;
  border-radius: 0.5vw;
  cursor: pointer;
  transition: background 0.1s ease, transform 0.05s ease;
  &:active:not(:disabled) { transform: translateY(0.08vw); }
  &:disabled { cursor: default; color: ${Palette.faint}; background: ${Palette.button.disabled}; border-color: ${Palette.faint}; }
`;

const Button = styled.button`
  ${pillBase}
  height: 2.2vw;
  padding: 0 1vw;
  font-size: 0.75vw;
  background: ${Palette.button.bg};
  &:hover:not(:disabled) {
    background: ${Palette.button.hover};
  }
`;

const Note = styled.span`
  font-family: Pixel;
  font-size: 0.58vw;
  color: ${Palette.muted};
`;
