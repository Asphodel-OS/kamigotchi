import styled from 'styled-components';

import { ActionListButton, TextTooltip } from 'app/components/library';
import { getObjectiveIcon, ObjectiveRow, Palette, RewardChip } from 'app/components/library/pastel';
import { Allo } from 'network/shapes/Allo';
import { Objective } from 'network/shapes/Quest/objective';
import { DetailedEntity } from 'network/shapes/utils';

export type QuestStatus = 'AVAILABLE' | 'ONGOING' | 'COMPLETED';

const HIDE_COUNT = ['QUEST', 'ROOM'];

type ButtonSpec = { label: string; onClick: () => void; disabled?: boolean };

// pinned footer: objectives, rewards and the one action that applies to the quest's status
export const Bottom = ({
  buttons,
  rewards = [],
  objectives = [],
  describeEntity,
  findRoomByName,
  burnItems,
  getItemBalance,
  questStatus,
}: {
  buttons: { AcceptButton: ButtonSpec; CompleteButton: ButtonSpec };
  rewards?: Allo[];
  objectives?: Objective[];
  describeEntity: (type: string, index: number) => DetailedEntity;
  findRoomByName: (name: string) => number | undefined;
  burnItems: (indices: number[], amts: number[]) => void;
  getItemBalance: (index: number) => number;
  questStatus: QuestStatus;
}) => {
  const { AcceptButton, CompleteButton } = buttons;
  const done = objectives.filter((o) => o.status?.completable).length;

  const ItemBurnButton = (objective: Objective) => {
    const show = questStatus === 'ONGOING' && objective.target.type === 'ITEM_BURN';
    if (!show) return null;

    const index = objective.target.index ?? 0;
    const have = getItemBalance(index);
    const gave = (objective.status?.current ?? 0) * 1;
    const want = (objective.status?.target ?? 0) * 1;
    const diff = want - gave;
    if (diff <= 0) return null;

    const options = [];
    if (have > 0) options.push({ text: 'Give 1', onClick: () => burnItems([index], [1]) });
    if (diff > have && have > 1)
      options.push({ text: `Give ${have}`, onClick: () => burnItems([index], [have]) });
    if (have >= diff && diff > 1)
      options.push({ text: `Give ${diff}`, onClick: () => burnItems([index], [diff]) });

    return (
      <ActionListButton
        id={`quest-item-burn-${objective.id}`}
        text='Give'
        options={options}
        size='small'
        disabled={have == 0}
      />
    );
  };

  const Objectives = (obj: Objective, i: number) => {
    const status = obj.status;
    const isBurn = obj.target.type === 'ITEM_BURN';
    const count = (() => {
      if (!status?.target || status.current === undefined) return undefined;
      if (isBurn || !HIDE_COUNT.includes(obj.target.type))
        return `${Number(status.current)}/${Number(status.target)}`;
    })();
    return (
      <ObjectiveRow
        key={`obj-${i}`}
        text={obj.name}
        icon={getObjectiveIcon(obj, describeEntity, findRoomByName)}
        complete={!!status?.completable}
        count={questStatus === 'ONGOING' ? count : undefined}
        action={ItemBurnButton(obj)}
      />
    );
  };

  const Action = () => {
    if (questStatus === 'ONGOING') {
      const button = (
        <Button disabled={CompleteButton.disabled} onClick={CompleteButton.onClick}>
          {CompleteButton.label}
        </Button>
      );
      return CompleteButton.disabled ? (
        <TextTooltip text={['Finish the objectives first']}>{button}</TextTooltip>
      ) : (
        button
      );
    }
    if (questStatus === 'COMPLETED' && AcceptButton.disabled)
      return <Button disabled>Completed</Button>;

    const button = (
      <Button disabled={AcceptButton.disabled} onClick={AcceptButton.onClick}>
        {AcceptButton.label}
      </Button>
    );
    return AcceptButton.label === 'Journey Onwards' ? (
      <TextTooltip text={['Proceed to the next quest in this chain']}>{button}</TextTooltip>
    ) : (
      button
    );
  };

  const note = () => {
    if (questStatus === 'ONGOING' && objectives.length > 0)
      return `${done}/${objectives.length} objectives done`;
    return '';
  };

  return (
    <Footer>
      {objectives.length > 0 && (
        <Section>
          <Label>Objectives</Label>
          {objectives.map(Objectives)}
        </Section>
      )}
      {rewards.length > 0 && (
        <Section>
          <Label>Rewards</Label>
          <Chips>
            {rewards
              .filter((r) => r.type !== 'NFT')
              .map((reward, i) => (
                <RewardChip
                  key={`reward-${i}`}
                  entity={describeEntity(reward.type, reward.index || 0)}
                  amount={reward.value ?? 0}
                />
              ))}
          </Chips>
        </Section>
      )}
      <Actions>
        <Note>{note()}</Note>
        {Action()}
      </Actions>
    </Footer>
  );
};

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9vw;
  padding: 0.9vw 1.2vw;
  background: ${Palette.soft};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45vw;
`;

const Label = styled.span`
  font-family: Pixel;
  font-size: 0.55vw;
  text-transform: uppercase;
  letter-spacing: 0.06vw;
  color: ${Palette.faint};
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75vw;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1vw;
`;

const Note = styled.span`
  font-family: Pixel;
  font-size: 0.6vw;
  color: ${Palette.muted};
`;

const Button = styled.button`
  height: 2.2vw;
  padding: 0 1.2vw;
  font-family: Pixel;
  font-size: 0.75vw;
  color: ${Palette.ink};
  background: ${Palette.button.bg};
  border: solid ${Palette.ink} 0.15vw;
  border-radius: 0.5vw;
  cursor: pointer;
  transition:
    background 0.1s ease,
    transform 0.05s ease;

  &:hover:not(:disabled) {
    background: ${Palette.button.hover};
  }
  &:active:not(:disabled) {
    transform: translateY(0.08vw);
  }
  &:disabled {
    cursor: default;
    color: ${Palette.faint};
    background: ${Palette.button.disabled};
    border-color: ${Palette.faint};
  }
`;
