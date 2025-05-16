import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  content: any;
  cursor?: string;
  mouseButton?: 0 | 2;
  closeOnClick?: boolean;
  // pass the  function from the parent component to execute when the popover closes
  onClose?: () => void;
  // forceclose the popover from the parent component
  forceClose?: boolean;
  // disable the popover from the parent component
  disabled?: boolean;
}

export const Popover = (props: Props) => {
  const { children, content, onClose, disabled, forceClose } = props;
  const cursor = props.cursor ?? 'pointer';
  const mouseButton = props.mouseButton ?? 0;
  const closeOnClick = props.closeOnClick ?? true;

  const popoverRef = useRef<HTMLDivElement>(document.createElement('div'));
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [clickedScrollBar, setClickedScrollBar] = useState(true);

  useEffect(() => {
    if (props.forceClose) {
      setIsVisible(false);
    }
  }, [props.forceClose]);

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
    const width = popoverRef.current?.offsetWidth || 0;
    const height = popoverRef.current?.offsetHeight || 0;
    const childrenPosition = triggerRef.current?.getBoundingClientRect();
    if (childrenPosition) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let x = childrenPosition.left;
      let y = childrenPosition.bottom - 10;
      if (x + width + 10 > viewportWidth) {
        x = childrenPosition.right - width;
      }
      if (y + height + 10 > viewportHeight) {
        y = childrenPosition.bottom - height - 10;
      }
      setPopoverPosition({ x, y });
    }
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
  max-height: 22vh;
  overflow-y: auto;
  overflow-x: hidden;
  visibility: ${({ isVisible }) => (isVisible ? `visible` : `hidden`)};
  position: fixed;
  margin-top: 1%;
  background-color: white;
  border: 0.15vw solid black;
  box-shadow: 0 0.3vw 0.8vw rgba(0, 0, 0, 0.7);
  border-radius: 0.45vw;
  z-index: 10;
  white-space: nowrap;
  max-width: fit-content;
  font-size: 0.6vw;
  top: ${({ popoverPosition }) => popoverPosition.y};
  left: ${({ popoverPosition }) => popoverPosition.x};
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.9vw;
  }
  ::-webkit-scrollbar-thumb {
    border: 0.2vw solid transparent;
    background-clip: padding-box;
    border-radius: 0.2vw;
    background-color: rgba(0, 0, 0, 0.15);
    &:hover {
      cursor: auto;
    }
  }
`;
