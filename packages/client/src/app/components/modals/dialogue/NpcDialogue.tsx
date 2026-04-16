import styled from 'styled-components';

import { Overlay } from 'app/components/library';
import { triggerQuestDetailsModal } from 'app/triggers/triggerQuestDetailsModal';
import { Quest } from 'network/shapes/Quest';
import { playClick } from 'utils/sounds';
import { TypewriterComponent } from '../questDetails/Typewriter';
/*
 * this will be trigerred when an npc does not have a quest associated to them
 * TODO: implement opening last quest associated with npc when clicking on them
 */
export const NpcDialogue = ({
  hasAvailableQuests = [],
  hasOngoingQuests = [],
  npcName = '',
  npcImage = '',
  dialogueText = '',
  dialogueOptions = [],
  npcColor = '',
  dialogueButtons = { BackButton: () => <></>, NextButton: () => <></>, MiddleButton: () => <></> },
  special,
  onDialogueComplete,
  twoColumnText = false,
}: {
  hasAvailableQuests?: Quest[];
  hasOngoingQuests?: Quest[];
  npcName: string;
  dialogueText: string;
  dialogueOptions?: Array<{ label: string; onClick: () => void }>;
  npcColor: string;
  npcImage: string;
  dialogueButtons: {
    BackButton: () => JSX.Element | null;
    NextButton: () => JSX.Element | null;
    MiddleButton: () => JSX.Element | null;
  };
  special?: { name: string; onclick: () => void };
  onDialogueComplete?: () => void;
  twoColumnText?: boolean;
}) => {
  const columnTexts = dialogueText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const leftColumnText = twoColumnText ? (columnTexts[0] ?? '') : dialogueText;
  const rightColumnText = twoColumnText ? (columnTexts[1] ?? '') : '';

  return (
    <>
      {twoColumnText ? (
        <ParallelColumns>
          <Text color={npcColor}>
            <TypewriterComponent
              text={leftColumnText}
              retrigger={`${leftColumnText}${Date.now()}`}
              onComplete={onDialogueComplete}
            />
          </Text>
          <Text color={npcColor}>
            <TypewriterComponent text={rightColumnText} retrigger={`${rightColumnText}${Date.now()}`} />
          </Text>
        </ParallelColumns>
      ) : (
        <Text color={npcColor}>
          <TypewriterComponent
            text={dialogueText}
            retrigger={`${dialogueText}${Date.now()}`}
            onComplete={onDialogueComplete}
          />
        </Text>
      )}
      <Overlay bottom={1} left={1.5}>
        <NpcName>{npcName}</NpcName>
      </Overlay>
      {dialogueOptions.length > 0 ? (
        <DialogueOptionsSection>
          <DialogueOptionsRow>
            {dialogueOptions.map((option, index) => {
              const isLastOddOption =
                dialogueOptions.length % 2 === 1 && index === dialogueOptions.length - 1;
              return (
                <DialogueOptionButton
                  key={`${option.label}-${index}`}
                  $fullRow={isLastOddOption}
                  color={npcColor}
                  onClick={() => {
                    playClick();
                    option.onClick();
                  }}
                >
                  {option.label}
                </DialogueOptionButton>
              );
            })}
          </DialogueOptionsRow>
        </DialogueOptionsSection>
      ) : null}
      <Bottom hasQuests={hasAvailableQuests.length > 0 || hasOngoingQuests.length > 0}>
        {dialogueButtons && (
          <NavigationRow>
            {dialogueButtons.BackButton()}
            {dialogueButtons.MiddleButton()}
            {dialogueButtons.NextButton()}
          </NavigationRow>
        )}
        {npcImage ? <NpcSprite src={npcImage} /> : null}
        <OptionColumn color={npcColor}>
          {special && (
            <>
              <OptionsLabel color={npcColor}>Rituals:</OptionsLabel>
              <Option
                color={npcColor}
                onClick={() => {
                  playClick();
                  special.onclick();
                }}
              >
                {special.name}
              </Option>
            </>
          )}
          <OptionsLabel color={npcColor}>Available Quests:</OptionsLabel>
          {hasAvailableQuests.length > 0 ? (
            hasAvailableQuests.map((quest, i) => (
              <Option
                color={npcColor}
                key={i}
                onClick={() => triggerQuestDetailsModal(quest.entity)}
              >
                {quest.name}
              </Option>
            ))
          ) : (
            <Message color={npcColor}>No quests available.</Message>
          )}
          <OptionsLabel color={npcColor}>Ongoing Quests:</OptionsLabel>
          {hasOngoingQuests.length > 0 ? (
            hasOngoingQuests.map((quest, i) => (
              <Option
                color={npcColor}
                key={i}
                onClick={() => triggerQuestDetailsModal(quest.entity)}
              >
                {quest.name}
              </Option>
            ))
          ) : (
            <Message color={npcColor}>No quests ongoing.</Message>
          )}
        </OptionColumn>
      </Bottom>
    </>
  );
};

const Text = styled.div<{
  color?: string;
}>`
  color: ${({ color }) => color || 'black'};
  position: relative;
  text-align: justify;
  width: 100%;
  padding: 0vw 1vw;
  flex-grow: 1;
  flex-flow: column nowrap;
  justify-content: flex-start;
  top: 0;
  font-size: 1vw;
  line-height: 2vw;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-y: auto;
  cursor: auto;
  transition:
    height 0.3s ease,
    visibility 0.3s ease;
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.3vw;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ color }) => color || 'black'};
    border-radius: 0.3vw;
    background-clip: padding-box;
  }
`;

const ParallelColumns = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2vw;
  align-items: stretch;
  flex-grow: 1;
  min-height: 0;
`;

const NavigationRow = styled.div`
  position: absolute;
  right: 2%;
  top: -2vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.3vw;
  z-index: 6;
`;

const DialogueOptionsSection = styled.div`
  width: 100%;
  padding: 0 0.6vw 0.2vw 0.6vw;
  margin-top: -0.15vw;
  margin-bottom: 2vw;
`;

const DialogueOptionsRow = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35vw 0.5vw;
  align-items: stretch;
`;

const DialogueOptionButton = styled.button<{ color?: string; $fullRow?: boolean }>`
  color: ${({ color }) => color || 'black'};
  border: solid black 0.15vw;
  background: white;
  border-radius: 0.3vw;
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 1);
  cursor: pointer;
  font-size: 0.75vw;
  line-height: 1.2vw;
  padding: 0.15vw 0.5vw;
  white-space: normal;
  width: 100%;
  ${({ $fullRow }) =>
    $fullRow
      ? `
    grid-column: 1 / -1;
    justify-self: center;
    width: 50%;
  `
      : ''}
`;

const NpcSprite = styled.img`
  position: absolute;
  left: 0;
  bottom: -4%;
  width: auto;
  height: 100%;
  max-width: 40%;
  object-fit: contain;
  object-position: bottom left;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

const NpcName = styled.div`
  color: black;
  border: solid black 0.15vw;
  padding: 0.3vw;
  font-size: min(2vw, 2vh);
  z-index: 3;
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 1);
  background-color: white;
`;

const Bottom = styled.div<{ hasQuests: boolean }>`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  border-top: solid grey 0.15vw;
  height: ${({ hasQuests }) => (hasQuests ? '60%' : '40%')};
  transition: height 0.3s ease;
`;

const OptionColumn = styled.div<{ color: string }>`
  margin-top: 0.5vw;
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-flow: column;
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 0.9vw;
  padding-top: 1vw;
  padding-right: 1vw;
  overflow-y: auto;
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.3vw;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ color }) => color};
    border-radius: 0.3vw;
    background-clip: padding-box;
  }
`;

const OptionsLabel = styled.div<{ color?: string }>`
  font-size: 0.9vw;
  color: ${({ color }) => color};
`;

const Option = styled.button<{ color?: string }>`
  position: relative;
  color: ${({ color }) => color || 'black'};
  border: solid black 0.15vw;
  padding: 0.1vw;
  text-wrap: wrap;
  font-size: 0.7vw;
  z-index: 3;
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 1);
  cursor: pointer;
  width: 55%;
  max-width: fit-content;
  padding: 0 0.5vw;
  border-radius: 0.3vw;
  line-height: 1.3vw;
  background-color: white;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ color?: string }>`
  position: relative;
  color: ${({ color }) => color || 'black'};
  padding: 0.2vw 0.3vw 0vw 0.3vw;
  font-size: 0.7vw;
  z-index: 3;
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 1);
  cursor: pointer;

  border-radius: 0.3vw;
  line-height: 1.3vw;
  background-color: white;
`;
