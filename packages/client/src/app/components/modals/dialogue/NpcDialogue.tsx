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
  npcColor = '',
  dialogueButtons = { BackButton: () => <></>, NextButton: () => <></>, MiddleButton: () => <></> },
  special,
}: {
  hasAvailableQuests?: Quest[];
  hasOngoingQuests?: Quest[];
  npcName: string;
  dialogueText: string;
  npcColor: string;
  npcImage: string;
  dialogueButtons: {
    BackButton: () => JSX.Element | null;
    NextButton: () => JSX.Element | null;
    MiddleButton: () => JSX.Element | null;
  };
  special?: { name: string; onclick: () => void };
}) => {
  //NOTE:
  //  typewriter should retrigger like this
  // not like questdialogue does
  //  it will bug otherwise
  return (
    <>
      <Text color={npcColor}>
        <TypewriterComponent retrigger={`${dialogueText}${Date.now()}`} text={dialogueText} />
      </Text>
      <Overlay bottom={1} left={1.5}>
        <NpcName>{npcName}</NpcName>
      </Overlay>
      <Bottom hasQuests={hasAvailableQuests.length > 0 || hasOngoingQuests.length > 0}>
        {dialogueButtons && (
          <ButtonRow>
            {dialogueButtons.BackButton()}
            {dialogueButtons.MiddleButton()}
            {dialogueButtons.NextButton()}
          </ButtonRow>
        )}
        <NpcSprite src={npcImage} />
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
  padding: 0em 1em;
  flex-grow: 1;
  flex-flow: column nowrap;
  justify-content: flex-start;
  top: 0;
  font-size: 1em;
  line-height: 2em;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-y: auto;
  cursor: auto;
  transition:
    height 0.3s ease,
    visibility 0.3s ease;
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.3em;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ color }) => color || 'black'};
    border-radius: 0.3em;
    background-clip: padding-box;
  }
`;

const ButtonRow = styled.div`
  position: absolute;
  right: 2%;
  top: -3em;
  z-index: 6;
  display: flex;
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
  border: solid black 0.15em;
  padding: 0.3em;
  font-size: min(2em, 2vh);
  z-index: 3;
  box-shadow: 0 0.1em 0.2em rgba(0, 0, 0, 1);
  background-color: white;
`;

const Bottom = styled.div<{ hasQuests: boolean }>`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  border-top: solid grey 0.15em;
  height: ${({ hasQuests }) => (hasQuests ? '60%' : '40%')};
  transition: height 0.3s ease;
`;

const OptionColumn = styled.div<{ color: string }>`
  margin-top: 0.5em;
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-flow: column;
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 0.9em;
  padding-top: 1em;
  padding-right: 1em;
  overflow-y: auto;
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.3em;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ color }) => color};
    border-radius: 0.3em;
    background-clip: padding-box;
  }
`;

const OptionsLabel = styled.div<{ color?: string }>`
  font-size: 0.9em;
  color: ${({ color }) => color};
`;

const Option = styled.button<{ color?: string }>`
  position: relative;
  color: ${({ color }) => color || 'black'};
  border: solid black 0.15em;
  padding: 0.1em;
  text-wrap: wrap;
  font-size: 0.7em;
  z-index: 3;
  box-shadow: 0 0.1em 0.2em rgba(0, 0, 0, 1);
  cursor: pointer;
  width: 55%;
  max-width: fit-content;
  padding: 0 0.5em;
  border-radius: 0.3em;
  line-height: 1.3em;
  background-color: white;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ color?: string }>`
  position: relative;
  color: ${({ color }) => color || 'black'};
  padding: 0.2em 0.3em 0em 0.3em;
  font-size: 0.7em;
  z-index: 3;
  box-shadow: 0 0.1em 0.2em rgba(0, 0, 0, 1);
  cursor: pointer;

  border-radius: 0.3em;
  line-height: 1.3em;
  background-color: white;
`;
