import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { mouseBttnClicked } from 'app/utils';
// TODO: fix closeOnClick dont working ok for nested buttons
export const Popover = ({
  children,
  content,
  cursor = 'pointer',
  mouseButton = 'left',
  closeOnClick = true,
  onClose,
  forceClose,
  disabled,
  fullWidth,
  maxHeight,
}: {
  children: React.ReactNode;
  content: any;
  cursor?: string;
  mouseButton?: 'left' | 'right';
  closeOnClick?: boolean;
  onClose?: () => void; // execute a function when the popover closes
  forceClose?: boolean; // forceclose the popover
  disabled?: boolean; // disable the popover
  fullWidth?: boolean;
  maxHeight?: number;
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

      // prevents popover from closing
      // when a nested button is clicked
      const clickedTrigger = (event.target as HTMLElement).closest('[data-popover-trigger]');
      const isNestedTrigger = clickedTrigger && clickedTrigger !== tRef;
      const didSelect =
        closeOnClick && pRef.contains(event.target) && !clickedScrollBar && !isNestedTrigger;
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

    const clickedTrigger = (event.target as HTMLElement).closest('[data-popover-trigger]');
    const isNestedTrigger = clickedTrigger && clickedTrigger !== triggerRef.current;
    if (isNestedTrigger) return;

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
    <PopoverContainer $fullwidth={fullWidth}>
      <PopoverTrigger
        cursor={cursor}
        ref={triggerRef}
        onMouseDown={(e) => {
          if (disabled || content.length === 0 || mouseBttnClicked(e) !== mouseButton) return;
          handlePosition();
          setIsVisible(!isVisible);
        }}
      >
        {children}
      </PopoverTrigger>
      {createPortal(
        <PopoverContent
          isVisible={isVisible}
          ref={popoverRef}
          popoverPosition={popoverPosition}
          maxHeight={maxHeight}
          onClick={(e) => {
            if (disabled) return;
            handleClick(e);
          }}
        >
          {Array.isArray(content)
            ? content.map((item, index) => <div key={`popover-item-${index}`}>{item}</div>)
            : content}
        </PopoverContent>,
        document.body
      )}
    </PopoverContainer>
  );
};

const PopoverContainer = styled.div<{ $fullwidth?: boolean }>`
  display: flex;
  position: relative;
  ${({ $fullwidth }) => $fullwidth && 'width: 100%;'}
`;

const PopoverTrigger = styled.div.attrs({ 'data-popover-trigger': true })<{ cursor: string }>`
  border: none;
  cursor: ${({ cursor }) => cursor};
  height: 100%;
  width: 100%;
`;

const PopoverContent = styled.div.attrs<{
  position?: string[];
  isVisible?: boolean;
  popoverPosition: { x: number; y: number };
  maxHeight?: number;
}>(({ isVisible, popoverPosition, maxHeight }) => ({
  style: {
    maxHeight: maxHeight ? `${maxHeight}vh` : '22vh',
    visibility: isVisible ? 'visible' : 'hidden',
    top: popoverPosition?.y,
    left: popoverPosition?.x,
  },
}))<{
  position?: string[];
  isVisible?: boolean;
  popoverPosition: { x: number; y: number };
  maxHeight?: number;
}>`
  position: fixed;
  font-size: clamp(0.75rem, 1.5vmin + 0.3rem, 1.1rem);
  overflow-y: auto;
  overflow-x: hidden;
  background-color: white;
  border: 0.1em solid black;
  border-radius: 0.5em;
  z-index: 10;
  max-width: fit-content;
  white-space: normal;
  overflow-wrap: break-word;

  ::-webkit-scrollbar {
    background: transparent;
    width: 0.6em;
  }

  ::-webkit-scrollbar-thumb {
    border: 0.15em solid transparent;
    background-clip: padding-box;
    border-radius: 0.15em;
    background-color: rgba(0, 0, 0, 0.15);
  }
`;
