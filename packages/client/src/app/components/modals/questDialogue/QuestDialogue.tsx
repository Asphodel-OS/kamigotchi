import { QuestsIcon } from 'assets/images/icons/menu';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { TypewriterComponent } from './Typewriter';

const DEFAULT_QUEST_BUTTONS = {
  AcceptButton: { label: '', onClick: () => {}, disabled: false, backgroundColor: '#f8f6e4' },
  CompleteButton: { label: '', onClick: () => {}, disabled: false, backgroundColor: '#f8f6e4' },
};

export const QuestDialogue = ({
  modalOpened = false,
  questText = '',
  questCompletion = '',
  questColor = '',
  questButtons = DEFAULT_QUEST_BUTTONS,
}: {
  modalOpened: boolean;
  questText: string;
  questCompletion?: string;
  questColor: string;
  questButtons?: {
    AcceptButton: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      backgroundColor?: string;
    };
    CompleteButton: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      backgroundColor?: string;
    };
  };
}) => {
  const { CompleteButton, AcceptButton } = questButtons;

  const hasCompletion = Boolean(questCompletion.trim());
  const [baseText, setBaseText] = useState(!hasCompletion);
  const [completionText, setCompletionText] = useState(hasCompletion);
  const [wasToggled, setWasToggled] = useState(false);
  const [cancelledIntro, setCancelledIntro] = useState(false);
  const [cancelledComplete, setCancelledComplete] = useState(false);

  const pastRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const isUserScrollingPastRef = useRef(false);
  const isUserScrollingMainRef = useRef(false);

  /////////////////
  // SUBSCRIPTIONS
  // shows completion text by default
  // hsa intro text as fallback
  useEffect(() => {
    setBaseText(!hasCompletion);
    setCompletionText(hasCompletion);
  }, [questCompletion, questText, modalOpened]);

  // resets cancelation when modal
  // opened or sectiosn are toggled
  useEffect(() => {
    setCancelledIntro(false);
    setCancelledComplete(false);
  }, [modalOpened, wasToggled]);

  //TODO: maybe make this a component
  ///////////////
  // HANDLERS
  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    isUserScrollingRef: React.MutableRefObject<boolean>
  ) => {
    if (ref.current && !isUserScrollingRef.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  const handleUserScroll = (
    ref: React.RefObject<HTMLDivElement>,
    isUserScrollingRef: React.MutableRefObject<boolean>
  ) => {
    if (!ref.current) return;
    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
    if (!isAtBottom) {
      isUserScrollingRef.current = true;
    } else {
      isUserScrollingRef.current = false;
    }
  };

  const toggleSections = () => {
    setWasToggled(!wasToggled);
    setCompletionText((prev) => !prev);
    setBaseText((prev) => !prev);
  };

  return (
    <>
      <>
        {questCompletion && (
          <Divider color={questColor} expanded={baseText} onClick={toggleSections}>
            Intro:
          </Divider>
        )}
        <Text
          ref={pastRef}
          isExpanded={baseText}
          color={questColor}
          onScroll={(e) => handleUserScroll(pastRef, isUserScrollingPastRef)}
          onClick={() => setCancelledIntro(true)} // only cancel this one
        >
          <TypewriterComponent
            speed={30}
            retrigger={`${modalOpened}${wasToggled}`}
            text={questText}
            onUpdate={() => handleScroll(pastRef, isUserScrollingPastRef)}
            cancelled={cancelledIntro}
          />
        </Text>
      </>
      {hasCompletion && (
        <>
          <Divider color={questColor} expanded={completionText} onClick={toggleSections}>
            Completed:
          </Divider>
          <Text
            ref={mainRef}
            isExpanded={completionText}
            color={questColor}
            onScroll={(e) => handleUserScroll(mainRef, isUserScrollingMainRef)}
            onClick={() => setCancelledComplete(true)} // only cancel this one
          >
            <TypewriterComponent
              speed={30}
              retrigger={`${modalOpened}${wasToggled}`}
              text={questCompletion}
              onUpdate={() => handleScroll(mainRef, isUserScrollingMainRef)}
              cancelled={cancelledComplete}
            />
          </Text>
        </>
      )}
      <Bottom color={questColor}>
        <NpcSprite src={QuestsIcon} />
        <OptionColumn>
          <OptionsLabel color={questColor}>Options:</OptionsLabel>
          <Option
            color={questColor}
            onClick={AcceptButton.onClick}
            disabled={AcceptButton.disabled}
            backgroundColor={AcceptButton.backgroundColor}
          >
            {AcceptButton.label}
          </Option>
          <Option
            color={questColor}
            onClick={CompleteButton.onClick}
            disabled={CompleteButton.disabled}
            backgroundColor={CompleteButton.backgroundColor}
          >
            {CompleteButton.label}
          </Option>
        </OptionColumn>
      </Bottom>
    </>
  );
};

const Text = styled.div<{ isExpanded?: boolean; color?: string }>`
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
  cursor: pointer;
  transition:
    height 0.3s ease,
    visibility 0.3s ease;
  height: ${({ isExpanded }) => (isExpanded ? '65%' : '0%')};
  visibility: ${({ isExpanded }) => (isExpanded ? 'visible' : 'hidden')};
  color: ${({ isExpanded, color }) => (isExpanded ? color : '#cfcfcf')};
  scrollbar-gutter: stable;
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

const Divider = styled.div<{ color?: string; expanded?: boolean }>`
  position: relative;
  width: 100%;
  cursor: pointer;
  height: 3%;
  border: ${({ color }) => `solid ${color} 0.15vw`};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1vw;
  padding: 0.8vw;
  color: ${({ color }) => color};
  ::after {
    content: ${({ expanded }) => (expanded ? '"▾"' : '"▸"')};
    color: ${({ color }) => color};
    font-size: 2.5vw;
    transform: scale(0.8);
    transition: transform 0.3s ease;
  }
`;

const NpcSprite = styled.img`
  filter: sepia(1);
  position: absolute;
  left: 0;
  width: auto;
  height: 100%;
  max-width: 40%;
  object-fit: contain;
  object-position: bottom left;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

const Bottom = styled.div<{ color: string }>`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  border-top: solid grey 0.15vw;
  height: 15vh;
  transition: height 0.3s ease;
  overflow-y: auto;
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.3vw;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ color }) => color};
    border-radius: 0.3vw;
  }
`;

const OptionColumn = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-flow: column;
  width: 100%;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 0.9vw;
  padding-top: 1vw;
  padding-right: 1vw;
`;

const OptionsLabel = styled.div<{ color?: string }>`
  font-size: 1vw;
  margin-right: 41%;
  color: ${({ color }) => color};
`;

const Option = styled.button<{ color?: string; backgroundColor?: string }>`
  position: relative;
  ${({ color }) => color && `color: ${color};  border: solid ${color} 0.15vw;`}
  padding: 0.2vw 0.3vw 0vw 0.3vw;
  font-size: 0.8vw;
  z-index: 3;
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 1);
  cursor: pointer;
  width: 60%;
  border-radius: 0.3vw;
  line-height: 1.3vw;
  background-color: ${({ backgroundColor }) => backgroundColor};
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;
