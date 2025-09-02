import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

export const Popover = ({
  children,
  content,
  cursor = 'pointer',
  mouseButton = 0,
  closeOnClick = true,
  onClose,
  forceClose,
  disabled,
}: {
  children: React.ReactNode;
  content: any;
  cursor?: string;
  mouseButton?: 0 | 2;
  closeOnClick?: boolean;
  onClose?: () => void; // execute a function when the popover closes
  forceClose?: boolean; // forceclose the popover
  disabled?: boolean; // disable the popover
}) => {
  const popoverRef = useRef<HTMLDivElement>(document.createElement('div'));
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [clickedScrollBar, setClickedScrollBar] = useState(true);

  useEffect(() => {
    if (forceClose) {
      setIsVisible(false);
    }
  }, [forceClose]);

  // add interaction event listeners
  useEffect(() => {
    handlePosition();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('wheel', handleScroll);
    window.addEventListener('resize', handlePosition);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('resize', handlePosition);
    };
  }, []);

  // add close listener (when clicking off the popover or selecting an option)
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      const pRef = popoverRef.current;
      const tRef = triggerRef.current;
      if (!pRef || !tRef) return;

      const didSelect = closeOnClick && pRef.contains(event.target) && !clickedScrollBar;
      const didOffclick = !pRef.contains(event.target) && !tRef.contains(event.target);
      if (didSelect || didOffclick) {
        setTimeout(() => {
          setIsVisible(false);
          if (onClose) onClose();
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /////////////////
  // EVENT HANDLERS

  const handleClick = (event: any) => {
    const clickX = event.clientX;
    const pRef = popoverRef.current;

    const rightBound = pRef.getBoundingClientRect().right;
    const leftBound = rightBound - (pRef.offsetWidth - pRef.clientWidth);
    if (clickX >= leftBound && clickX <= rightBound) setClickedScrollBar(true);
    else setClickedScrollBar(false);

    closeOnClick ? setIsVisible(false) : setIsVisible(true);
    if (!isVisible && onClose) onClose();
  };

  const handlePosition = () => {
    const popoverEl = popoverRef.current;
    const triggerEl = triggerRef.current;
    if (!popoverEl || !triggerEl) return;
    const triggerRect = triggerEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let x = triggerRect.left;
    let y = triggerRect.bottom;
    // avoids going off the bottom of the screen
    if (y + popoverEl.offsetHeight > viewportHeight) {
      y = triggerRect.top - popoverEl.offsetHeight;
    }
    // avoids going off the top of the screen
    if (y < 0) y = 10;
    // avoids going off the right side of the screen
    if (x + popoverEl.offsetWidth > viewportWidth) {
      x = triggerRect.right - popoverEl.offsetWidth;
    }
    // avoids going off the left side of the screen
    if (x < 0) x = 10;
    setPopoverPosition({ x, y });
  };

  const handleScroll = (event: any) => {
    if (popoverRef.current && triggerRef.current) {
      if (
        !popoverRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsVisible(false);
        if (onClose) onClose();
      }
    }
  };

  return (
    <PopoverContainer onContextMenu={(e) => mouseButton === 2 && e.preventDefault()}>
      <PopoverTrigger
        cursor={cursor}
        ref={triggerRef}
        onMouseDown={(e) => {
          if (disabled || content.length === 0 || e.button !== mouseButton) return;
          handlePosition();
          setIsVisible(!isVisible);
        }}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        isVisible={isVisible}
        ref={popoverRef}
        popoverPosition={popoverPosition}
        onClick={(e) => {
          if (disabled) return;
          handleClick(e);
        }}
      >
        {Array.isArray(content)
          ? content.map((item, index) => <div key={`popover-item-${index}`}>{item}</div>)
          : content}
      </PopoverContent>
    </PopoverContainer>
  );
};

const PopoverContainer = styled.div`
  display: flex;
  position: relative;
`;

const PopoverTrigger = styled.div<{ cursor: string }>`
  border: none;
  cursor: ${({ cursor }) => cursor};
  height: 100%;
  width: 100%;
`;

const PopoverContent = styled.div<{
  position?: string[];
  dimensions?: any;
  isVisible?: boolean;
  popoverPosition: any;
}>`
  max-height: 22em;
  overflow-y: auto;
  overflow-x: hidden;
  visibility: ${({ isVisible }) => (isVisible ? `visible` : `hidden`)};
  position: fixed;

  background-color: white;
  border: 0.15em solid black;
  border-radius: 0.45em;
  z-index: 10;
  white-space: nowrap;
  max-width: fit-content;
  font-size: 0.6em;
  top: ${({ popoverPosition }) => popoverPosition.y};
  left: ${({ popoverPosition }) => popoverPosition.x};
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.9em;
  }
  ::-webkit-scrollbar-thumb {
    border: 0.2em solid transparent;
    background-clip: padding-box;
    border-radius: 0.2em;
    background-color: rgba(0, 0, 0, 0.15);
    &:hover {
      cursor: auto;
    }
  }
`;
