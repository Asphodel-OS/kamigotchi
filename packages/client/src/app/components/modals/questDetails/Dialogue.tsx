import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { TypewriterComponent } from './Typewriter';

type MODE = 'INTRO' | 'OUTRO';

export const Dialogue = ({
  text,
  color,
  completionText = '',
  isComplete,
  isAccepted,
  justCompleted,
  isModalOpen,
  onOutroFinished,
}: {
  text: string;
  color: string;
  completionText?: string;
  isModalOpen: boolean;
  isComplete: boolean;
  isAccepted: boolean;
  justCompleted: boolean;
  isCompletionPending?: boolean;
  onOutroFinished?: () => void;
}) => {
  const [mode, setMode] = useState<MODE>('INTRO');
  const [wasToggled, setWasToggled] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [lineFinished, setLineFinished] = useState(false);
  const [revealedLines, setRevealedLines] = useState<string[]>([]);

  const introRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const isUserScrollingPastRef = useRef(false);
  const isUserScrollingMainRef = useRef(false);

  const introLines = text.split('\n').filter(Boolean);
  const outroLines = completionText.split('\n').filter(Boolean);

  /////////////////
  // SUBSCRIPTIONS

  // shows completion text by default intro text as fallback
  useEffect(() => {
    if (isModalOpen) {
      setMode(completionText && isComplete ? 'OUTRO' : 'INTRO');
    }
  }, [isModalOpen, completionText, isComplete]);

  // resets cancelation when modal is opened or sections are toggled
  useEffect(() => {
    setLineIndex(0);
    setRevealedLines([]);
    setInterrupted(false);
    setLineFinished(false);
  }, [isModalOpen, wasToggled, justCompleted]);

  ///////////////
  // HANDLERS

  // if the user is not scrolling autoscroll to track generated text
  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    isUserScrollingRef: React.MutableRefObject<boolean>
  ) => {
    if (ref.current && !isUserScrollingRef.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  // determine whether the user is scrolling based on scroll position
  const handleUserScroll = (
    ref: React.RefObject<HTMLDivElement>,
    scrollingRef: React.MutableRefObject<boolean>
  ) => {
    if (!ref.current) return;
    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
    if (!isAtBottom) {
      scrollingRef.current = true;
    } else {
      scrollingRef.current = false;
    }
  };
  // trigger a toggle between the two modes
  const toggleSections = () => {
    if (mode === 'INTRO') setMode('OUTRO');
    else setMode('INTRO');
    setWasToggled(!wasToggled);
  };

  const handleAdvance = (lines: string[]) => {
    const currentLine = lines[lineIndex] ?? '';

    // on click skips the animation
    // for tat line
    if (!lineFinished) {
      setInterrupted(true);
      return;
    }
    // this is for the isjustCompleted flag
    const isLastLine = lineIndex >= lines.length - 1;
    if (isLastLine) {
      onOutroFinished?.();
      return;
    }
    //add new line to revealed lines
    setRevealedLines((prev) => [...prev, currentLine]);

    // advance line if there are more
    if (lineIndex <= lines.length - 1) {
      setLineIndex((i) => i + 1);
      setInterrupted(false);
      setLineFinished(false);
    }

    // force scroll to bottom on click
    const ref = mode === 'INTRO' ? introRef : outroRef;
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  /////////////////
  // RENDER

  return (
    <>
      {!!completionText && (
        <Divider color={color} expanded={mode === 'INTRO'} onClick={toggleSections}>
          Intro:
        </Divider>
      )}
      <Text
        ref={introRef}
        isExpanded={mode === 'INTRO'}
        color={color}
        onClick={!isAccepted ? () => handleAdvance(introLines) : undefined}
        onScroll={() => handleUserScroll(introRef, isUserScrollingPastRef)}
      >
        {!isAccepted ? (
          <>
            {revealedLines.map((line, i) => (
              <TypewriterComponent
                key={i}
                text={line}
                interrupted
                retrigger={`${isModalOpen}${wasToggled}${lineIndex}`}
              />
            ))}
            <TypewriterComponent
              text={introLines[lineIndex] ?? ''}
              speed={15}
              interrupted={interrupted}
              retrigger={`${isModalOpen}${wasToggled}${lineIndex}`}
              onComplete={() => setLineFinished(true)}
              onUpdate={() => handleScroll(introRef, isUserScrollingPastRef)}
              showContinueArrow={lineFinished && lineIndex < introLines.length - 1}
            />
          </>
        ) : (
          <TypewriterComponent text={text} interrupted={true} />
        )}
      </Text>
      {!!completionText && (
        <>
          <Divider color={color} expanded={mode === 'OUTRO'} onClick={toggleSections}>
            Outro:
          </Divider>
          <Text
            ref={outroRef}
            isExpanded={mode === 'OUTRO'}
            color={color}
            onClick={justCompleted ? () => handleAdvance(outroLines) : undefined}
            onScroll={() => handleUserScroll(outroRef, isUserScrollingMainRef)}
          >
            {isComplete && justCompleted ? (
              <>
                {revealedLines.map((line, i) => (
                  <TypewriterComponent
                    key={i}
                    text={line}
                    interrupted
                    retrigger={`${isModalOpen}${wasToggled}${lineIndex}`}
                  />
                ))}
                <TypewriterComponent
                  text={outroLines[lineIndex] ?? ''}
                  speed={15}
                  interrupted={interrupted}
                  retrigger={`${isModalOpen}${wasToggled}${lineIndex}`}
                  onComplete={() => setLineFinished(true)}
                  onUpdate={() => handleScroll(outroRef, isUserScrollingMainRef)}
                  showContinueArrow={lineFinished && lineIndex < outroLines.length - 1}
                />
              </>
            ) : isComplete && !justCompleted ? (
              <TypewriterComponent text={completionText} interrupted={true} />
            ) : (
              <EmptyText
                textColor={color}
                text={['Empty for now, finish this quest and maybe then...']}
              />
            )}
          </Text>
        </>
      )}
    </>
  );
};

const Text = styled.div<{ isExpanded?: boolean; color?: string }>`
  position: relative;
  visibility: ${({ isExpanded }) => (isExpanded ? 'visible' : 'hidden')};

  width: 100%;
  height: ${({ isExpanded }) => (isExpanded ? '65%' : '0%')};
  padding: 0vw 1vw;
  top: 0;

  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;

  font-size: 1vw;
  line-height: 2vw;
  text-align: justify;
  white-space: pre-line;
  word-wrap: break-word;
  color: ${({ isExpanded, color }) => (isExpanded ? color : '#cfcfcf')};

  cursor: pointer;
  transition:
    height 0.3s ease,
    visibility 0.3s ease;

  overflow-y: auto;
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

const Divider = styled.button<{ color?: string; expanded?: boolean }>`
  position: relative;
  border: ${({ color }) => `solid ${color} 0.15vw`};

  width: 100%;
  height: 3%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  font-size: 1vw;
  padding: 0.8vw;
  color: ${({ color }) => color};

  cursor: pointer;

  ::after {
    content: ${({ expanded }) => (expanded ? '"▾"' : '"▸"')};
    color: ${({ color }) => color};
    font-size: 2.5vw;
    transform: scale(0.8) translateY(-0.2vw);
    transition: transform 0.3s ease;
  }
`;
