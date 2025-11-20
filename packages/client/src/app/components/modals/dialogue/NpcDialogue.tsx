import { Overlay } from 'app/components/library';
import { triggerQuestDialogueModal } from 'app/triggers/triggerQuestDialogueModal';
import { objectMinaRed } from 'assets/images/rooms/13_giftshop';
import { Quest } from 'network/shapes/Quest';
import styled from 'styled-components';
import { TypewriterComponent } from '../questDialogue/Typewriter';
/* 
this will be trigered
when a npc has not a quest 
associated to them 
TODO: implement  opening last quest 
associated with npc when clicking on them
*/
export const NpcDialogue = ({
  hasAvailableQuests = [],
  hasOngoingQuests = [],
  npcName = '',
  dialogueText = '',
  npcColor = '',
  dialogueButtons = { BackButton: () => <></>, NextButton: () => <></>, MiddleButton: () => <></> },
}: {
  hasAvailableQuests?: Quest[];
  hasOngoingQuests?: Quest[];
  npcName: string;
  dialogueText: string;
  npcColor: string;
  dialogueButtons: {
    BackButton: () => JSX.Element | null;
    NextButton: () => JSX.Element | null;
    MiddleButton: () => JSX.Element | null;
  };
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
        <NpcSprite src={objectMinaRed} />
        <OptionColumn color={npcColor}>
          <OptionsLabel color={npcColor}>Available Quests:</OptionsLabel>
          {hasAvailableQuests.length > 0 ? (
            hasAvailableQuests.map((quest, i) => (
              <Option
                color={npcColor}
                key={i}
                onClick={() => triggerQuestDialogueModal(quest.entity)}
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
                onClick={() => triggerQuestDialogueModal(quest.entity)}
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
  color: #cfcfcf;
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
  color: ${({ color }) => color};
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

const ButtonRow = styled.div`
  position: absolute;
  right: 2%;
  top: -2vw;
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
  color: white;
  border: solid white 0.15vw;
  padding: 0.3vw;
  font-size: min(2vw, 2vh);
  z-index: 3;
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 1);
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
  font-size: 1vw;
  color: ${({ color }) => color};
`;

const Option = styled.button<{ color?: string }>`
  position: relative;
  color: ${({ color }) => color};
  border: solid white 0.15vw;
  padding: 0.1vw;
  text-wrap: wrap;
  font-size: 0.7vw;
  z-index: 3;
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 1);
  cursor: pointer;
  width: 55%;
  border-radius: 0.3vw;
  line-height: 1.3vw;
  background-color: black;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ color?: string }>`
  position: relative;
  color: ${({ color }) => color};
  padding: 0.2vw 0.3vw 0vw 0.3vw;
  font-size: 0.7vw;
  z-index: 3;
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 1);
  cursor: pointer;

  border-radius: 0.3vw;
  line-height: 1.3vw;
  background-color: black;
`;
