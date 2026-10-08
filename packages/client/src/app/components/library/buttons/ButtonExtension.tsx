import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';

export type ButtonExtensionDirection = 'left' | 'right';

export interface ButtonExtensionProps {
  children: ReactNode; // the button being extended (any element)
  content: ReactNode; // revealed when fully open
  peek?: ReactNode; // shown on its own while peeking, and next to the button when open
  isPeeking?: boolean; // without hover, open just far enough to show `peek`
  isOpen?: boolean; // force fully open (e.g. controlled/touch); hover still opens it otherwise
  disabled?: boolean; // never open or peek
  direction?: ButtonExtensionDirection; // side the panel slides out on
  glow?: boolean; // pulse a glow around the button and panel, e.g. to flag something actionable
  glowColor?: string; // any css color
  onClick?: () => void; // click on the panel
  radius?: string; // css length matching the button's corner radius
  background?: string;
  padding?: string; // vertical and far-side padding, as `<vertical> <horizontal>`
}

const PEEK_PAD = 14; // px of panel kept past the peek content while peeking
const DEFAULT_GLOW = 'rgba(255, 200, 30, 0.9)';

// wraps a button with a panel that slides out from behind one of its sides.
// the panel opens fully on hover (button or panel) or when `isOpen`, and opens partway
// to show only `peek` while `isPeeking`. sizes are measured, so any content works
export const ButtonExtension = ({
  children,
  content,
  peek,
  isPeeking = false,
  isOpen = false,
  disabled = false,
  direction = 'right',
  glow = false,
  glowColor = DEFAULT_GLOW,
  onClick,
  radius = '0.9vh',
  background = '#fff',
  padding = '0.6vh 1.2vw',
}: ButtonExtensionProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [widths, setWidths] = useState({ peek: 0, open: 0 });
  const innerRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const showPeek = isPeeking && !!peek;

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const peekEl = peekRef.current;
    const open = inner.scrollWidth;
    let peek = 0;
    if (peekEl) {
      peek =
        direction === 'right'
          ? peekEl.offsetLeft + peekEl.offsetWidth + PEEK_PAD
          : open - peekEl.offsetLeft + PEEK_PAD;
    }
    setWidths((prev) => (prev.open === open && prev.peek === peek ? prev : { open, peek }));
  });

  const panelWidth = disabled ? 0 : isHovered || isOpen ? widths.open : showPeek ? widths.peek : 0;

  const peekNode = showPeek && <div ref={peekRef}>{peek}</div>;

  return (
    <Wrapper onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <ButtonSlot $glow={glow} $glowColor={glowColor} $radius={radius}>
        {children}
      </ButtonSlot>
      <Panel
        style={{ width: panelWidth }}
        $open={panelWidth > 0}
        $glow={glow}
        $glowColor={glowColor}
        $radius={radius}
        $direction={direction}
        $background={background}
        $clickable={!!onClick}
        onClick={onClick}
      >
        <Inner ref={innerRef} $radius={radius} $direction={direction} $padding={padding}>
          {direction === 'right' ? (
            <>
              {peekNode}
              {content}
            </>
          ) : (
            <>
              {content}
              {peekNode}
            </>
          )}
        </Inner>
      </Panel>
    </Wrapper>
  );
};

/////////////////
// STYLES

const Wrapper = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
`;

const pulses = new Map<string, ReturnType<typeof keyframes>>();
const getPulse = (color: string) => {
  let pulse = pulses.get(color);
  if (!pulse) {
    pulse = keyframes`
      0%, 100% { box-shadow: 0 0 0.6vh 0.1vh ${color}; }
      50% { box-shadow: 0 0 1.8vh 0.5vh ${color}; }
    `;
    pulses.set(color, pulse);
  }
  return pulse;
};

const glowRule = (color: string) => css`
  animation: ${getPulse(color)} 1.6s ease-in-out infinite;
`;

// sits above the panel so the panel appears to slide out from behind the button
const ButtonSlot = styled.span<{ $glow: boolean; $glowColor: string; $radius: string }>`
  position: relative;
  z-index: 1;
  display: flex;
  border-radius: ${({ $radius }) => $radius};
  ${({ $glow, $glowColor }) => $glow && glowRule($glowColor)}
`;

// tucked one corner radius under the button's edge; the inner padding clears that overlap
const Panel = styled.div<{
  $open: boolean;
  $glow: boolean;
  $glowColor: string;
  $radius: string;
  $direction: ButtonExtensionDirection;
  $background: string;
  $clickable: boolean;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  ${({ $direction, $radius }) =>
    $direction === 'right'
      ? `left: calc(100% - ${$radius}); border-left: none; border-radius: 0 ${$radius} ${$radius} 0;`
      : `right: calc(100% - ${$radius}); border-right: none; border-radius: ${$radius} 0 0 ${$radius};`}

  overflow: hidden;
  box-sizing: border-box;
  background-color: ${({ $background }) => $background};
  border-top: solid black 0.15vw;
  border-bottom: solid black 0.15vw;
  border-${({ $direction }) => $direction}: solid black 0.15vw;

  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition:
    width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.1),
    opacity 0.15s ease-out;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  /* the ui grid disables pointer events for everything; opt back in while visible so
     hovering the panel keeps it expanded (and a hidden panel never catches the cursor) */
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  ${({ $glow, $glowColor }) => $glow && glowRule($glowColor)}
`;

// pinned to the button side so a partial panel width reveals the content nearest the button
const Inner = styled.div<{
  $radius: string;
  $direction: ButtonExtensionDirection;
  $padding: string;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  ${({ $direction }) => ($direction === 'right' ? 'left: 0;' : 'right: 0;')}
  box-sizing: border-box;
  width: max-content;
  padding: ${({ $padding }) => $padding};
  padding-${({ $direction }) => ($direction === 'right' ? 'left' : 'right')}: calc(
    ${({ $radius }) => $radius} * 2.5
  );

  display: flex;
  align-items: center;
  gap: 1vw;
  white-space: nowrap;
  user-select: none;
`;
