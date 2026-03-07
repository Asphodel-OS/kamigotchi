import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const formatBoldKeywords = (text: string) => {
  const parts = text.split(/(MINA|MENU)/g);
  return parts.map((part, i) =>
    /^(MINA|MENU)$/.test(part) ? (
      <strong style={{ color: 'inherit' }} key={i}>
        {part}
      </strong>
    ) : (
      part
    )
  );
};

export const useTypewriter = (
  text: string,
  speed: number,
  retrigger?: boolean | string,
  onUpdate?: () => void,
  interrupted?: boolean,
  onComplete?: () => void
) => {
  const [revealedIndex, setRevealedIndex] = useState(0);
  const retriggerRef = useRef(retrigger);

  const isResetting = retriggerRef.current !== retrigger;

  // If interrupted, always show full text immediately (no flash)
  // Otherwise, show 0 during reset to prevent stale index flash
  const displayIndex = interrupted ? text.length : isResetting ? 0 : revealedIndex;

  useEffect(() => {
    retriggerRef.current = retrigger;
    setRevealedIndex(0);
  }, [retrigger]);

  useEffect(() => {
    if (!text || interrupted) {
      if (interrupted) {
        setRevealedIndex(text.length);
        onComplete?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setRevealedIndex((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          onComplete?.();
          return prev;
        }
        onUpdate?.();
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, retrigger, onUpdate, interrupted, onComplete]);

  return displayIndex;
};

// all in one block
const SingleLineTypewriter = ({
  text = '',
  retrigger,
  speed = 30,
  onUpdate,
  interrupted = false,
  onComplete,
  showContinueArrow = false,
}: {
  text?: string;
  retrigger?: boolean | string;
  speed?: number;
  onUpdate?: () => void;
  interrupted?: boolean;
  onComplete?: () => void;
  showContinueArrow?: boolean;
}) => {
  const revealedIndex = useTypewriter(text, speed, retrigger, onUpdate, interrupted, onComplete);
  const revealed = text.slice(0, revealedIndex);
  const remaining = text.slice(revealedIndex);

  return (
    <Container>
      <span>{formatBoldKeywords(revealed)}</span>
      <span style={{ visibility: 'hidden' }}>{formatBoldKeywords(remaining)}</span>
      {showContinueArrow && <Arrow>▸</Arrow>}
    </Container>
  );
};

// click to advance
// this is the one we are using now in quest dialogue
const MultiLineTypewriter = ({
  text = '',
  retrigger,
  speed = 30,
  onUpdate,
  onAllLinesComplete,
}: {
  text?: string;
  retrigger?: boolean | string;
  speed?: number;
  onUpdate?: () => void;
  onAllLinesComplete?: () => void;
}) => {
  const [lineIndex, setLineIndex] = useState(0);
  const [revealedLines, setRevealedLines] = useState<string[]>([]);
  const [lineFinished, setLineFinished] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);

  const lines = text.split('\n').filter(Boolean);
  const currentLine = lines[lineIndex] ?? '';
  const isLastLine = lineIndex >= lines.length - 1;

  // retrigger resets state
  useEffect(() => {
    setLineIndex(0);
    setRevealedLines([]);
    setLineFinished(false);
    setIsInterrupted(false);
  }, [retrigger]);

  const handleClick = () => {
    if (!lineFinished) {
      // skip current line
      setIsInterrupted(true);
      setTimeout(() => onUpdate?.(), 0);
      return;
    }

    if (isLastLine) {
      // all lines have been read
      onAllLinesComplete?.();
      return;
    }

    // move to next line
    setRevealedLines((prev) => [...prev, currentLine]);
    setLineIndex((i) => i + 1);
    setIsInterrupted(false);
    setLineFinished(false);
    setTimeout(() => onUpdate?.(), 0);
  };

  const handleLineComplete = () => {
    setLineFinished(true);
    setTimeout(() => onUpdate?.(), 0);
  };

  return (
    <ClickableArea onClick={handleClick}>
      {revealedLines.map((line, i) => (
        <SingleLineTypewriter key={i} text={line} interrupted retrigger={retrigger} />
      ))}
      <SingleLineTypewriter
        text={currentLine}
        speed={speed}
        interrupted={isInterrupted}
        retrigger={`${retrigger}${lineIndex}`}
        onComplete={handleLineComplete}
        onUpdate={onUpdate}
        showContinueArrow={lineFinished && !isLastLine}
      />
    </ClickableArea>
  );
};

export const TypewriterComponent = ({
  text = '',
  retrigger,
  speed = 30,
  onUpdate,
  interrupted = false,
  onComplete,
  showContinueArrow = false,
  multiLine = false,
  onAllLinesComplete,
}: {
  text?: string;
  retrigger?: boolean | string;
  speed?: number;
  onUpdate?: () => void;
  interrupted?: boolean;
  onComplete?: () => void;
  showContinueArrow?: boolean;
  multiLine?: boolean;
  onAllLinesComplete?: () => void;
}) => {
  if (multiLine) {
    return (
      <MultiLineTypewriter
        text={text}
        retrigger={retrigger}
        speed={speed}
        onUpdate={onUpdate}
        onAllLinesComplete={onAllLinesComplete}
      />
    );
  }

  return (
    <SingleLineTypewriter
      text={text}
      retrigger={retrigger}
      speed={speed}
      onUpdate={onUpdate}
      interrupted={interrupted}
      onComplete={onComplete}
      showContinueArrow={showContinueArrow}
    />
  );
};

const Container = styled.div`
  font-size: inherit;
  color: inherit;
  white-space: pre-wrap;
`;

const ClickableArea = styled.div`
  font-size: inherit;
  color: inherit;
  white-space: pre-wrap;
  cursor: pointer;
  height: 100%;
  width: 100%;
`;

const Arrow = styled.span`
  margin-left: 0.3em;
  animation: flicker 1s steps(1) infinite;
  font-size: 1.4em;
  line-height: 1;
  vertical-align: middle;
  @keyframes flicker {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;
