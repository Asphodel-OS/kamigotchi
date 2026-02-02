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
  onOutroFinished?: () => void;
}) => {
  const [mode, setMode] = useState<MODE>('INTRO');
  const [wasToggled, setWasToggled] = useState(false);

  const introRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const isUserScrollingIntroRef = useRef(false);
  const isUserScrollingOutroRef = useRef(false);

  // shows completion text by default intro text as fallback

  useEffect(() => {
    if (isModalOpen) {
      setMode(completionText && isComplete ? 'OUTRO' : 'INTRO');
      // reset scroll
      isUserScrollingIntroRef.current = false;
      isUserScrollingOutroRef.current = false;
    }
  }, [isModalOpen, completionText, isComplete]);

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
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    scrollingRef.current = !isAtBottom;
  };

  // trigger a toggle between the two modes
  const toggleSections = () => {
    setMode((mode) => (mode === 'INTRO' ? 'OUTRO' : 'INTRO'));
    setWasToggled((t) => !t);
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
        onScroll={() => handleUserScroll(introRef, isUserScrollingIntroRef)}
      >
        {!isAccepted ? (
          <TypewriterComponent
            text={text}
            multiLine
            speed={15}
            retrigger={`${isModalOpen}${wasToggled}`}
            onUpdate={() => handleScroll(introRef, isUserScrollingIntroRef)}
          />
        ) : (
          <TypewriterComponent text={text} interrupted />
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
            onScroll={() => handleUserScroll(outroRef, isUserScrollingOutroRef)}
          >
            {isComplete && justCompleted ? (
              <TypewriterComponent
                text={completionText}
                multiLine
                speed={15}
                retrigger={`${isModalOpen}${wasToggled}${justCompleted}`}
                onUpdate={() => handleScroll(outroRef, isUserScrollingOutroRef)}
                onAllLinesComplete={onOutroFinished}
              />
            ) : isComplete && !justCompleted ? (
              <TypewriterComponent text={completionText} interrupted />
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
