import { useEffect, useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';

const boldName = (text: string, key: number | string) => (
  <strong style={{ color: 'inherit' }} key={key}>
    {text}
  </strong>
);

export const useTypewriter = (
  text: string,
  speed: number,
  paragraph: { distance: number; delay: number },
  retrigger?: boolean | string,
  onUpdate?: () => void,
  interrupted?: boolean
) => {
  const [displayedText, setDisplayedText] = useState<ReactNode[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText([]);
    indexRef.current = 0;
  }, [retrigger]);

  useEffect(() => {
    if (!text) return;
    const lastCharRef = { current: '' };

    if (interrupted) {
      const parts = text.split(/(MINA|MENU)/g);
      const result = parts.map((part, i) =>
        /^(MINA|MENU)$/.test(part) ? boldName(part, i) : part
      );
      setDisplayedText(result);
      indexRef.current = text.length;
      return;
    }

    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        return;
      }

      // leaving this hardcorded for now
      const remaining = text.substring(indexRef.current);
      const isMina = remaining.startsWith('MINA');
      const isMenu = remaining.startsWith('MENU');

      if (lastCharRef.current === '”') {
        if (paragraph.distance > 0) {
          const breaks = Array(paragraph.distance).fill('\n');
          setDisplayedText((prev) => [...prev, ...breaks]);
        }
        if (paragraph.delay > 0) {
        }
      }
      let lastChar: string | null = null;
      if (isMina || isMenu) {
        const name = isMina ? 'MINA' : 'MENU';
        setDisplayedText((prev) => [...prev, boldName(name, indexRef.current)]);
        lastChar = name[name.length - 1];
        indexRef.current += 4;
      } else {
        lastChar = remaining[0];
        setDisplayedText((prev) => [...prev, lastChar]);
        indexRef.current += 1;
      }

      lastCharRef.current = lastChar;

      if (onUpdate) onUpdate();
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, retrigger, onUpdate, interrupted]);

  return displayedText;
};

export const TypewriterComponent = ({
  text = '',
  retrigger,
  speed = 30,
  onUpdate,
  interrupted = false,
  paragraph = { distance: 0, delay: 0 },
}: {
  text?: string;
  retrigger?: boolean | string;
  speed?: number;
  onUpdate?: () => void;
  interrupted?: boolean;
  paragraph?: { distance: number; delay: number };
}) => {
  const displayedText = useTypewriter(text, speed, paragraph, retrigger, onUpdate, interrupted);
  return <Container>{displayedText}</Container>;
};

const Container = styled.div`
  font-size: inherit;
  color: inherit;
  white-space: pre-wrap;
`;
