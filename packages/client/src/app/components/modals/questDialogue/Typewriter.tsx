import { useEffect, useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';

export const useTypewriter = (
  text: string,
  speed: number,
  retrigger?: boolean | string,
  onUpdate?: () => void,
  cancelled?: boolean
) => {
  const [displayedText, setDisplayedText] = useState<ReactNode[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText([]);
    indexRef.current = 0;
  }, [retrigger]);

  useEffect(() => {
    if (!text) return;
    if (cancelled) {
      setDisplayedText([text]);
      indexRef.current = text.length;
      return;
    }
    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        clearInterval(interval);

        return;
      }
      // leaving this hardcoreded
      // for now
      const remaining = text.substring(indexRef.current);
      const Mina = remaining.startsWith('MINA');
      const Menu = remaining.startsWith('MENU');
      if (Mina || Menu) {
        setDisplayedText((prev) => [
          ...prev,
          <strong style={{ color: 'inherit' }} key={indexRef.current}>
            {Mina ? 'MINA' : Menu ? 'MENU' : ''}
          </strong>,
        ]);
        indexRef.current += 4;
      } else {
        setDisplayedText((prev) => [...prev, remaining[0]]);
        indexRef.current += 1;
      }

      if (onUpdate) onUpdate();
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, retrigger, onUpdate]);

  return displayedText;
};

export const TypewriterComponent = ({
  text = '',
  retrigger,
  speed = 30,
  onUpdate,
  cancelled = false,
}: {
  text?: string;
  retrigger?: boolean | string;
  speed?: number;
  onUpdate?: () => void;
  cancelled?: boolean;
}) => {
  const displayedText = useTypewriter(text, speed, retrigger, onUpdate, cancelled);
  return <Container>{displayedText}</Container>;
};

const Container = styled.div`
  font-size: inherit;
  color: inherit;
  white-space: pre-wrap;
`;
