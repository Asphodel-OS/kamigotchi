import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  content: any;
  cursor?: string;
  mouseButton?: 0 | 2;
  closeOnClick?: boolean;
  isScrollable?: boolean;
}

export const Popover = (props: Props) => {
  const { children, content } = props;
  const [isVisible, setIsVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(document.createElement('div'));
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const cursor = props.cursor ?? 'pointer';
  const mouseButton = props.mouseButton ?? 0;
  const closeOnClick = props.closeOnClick ?? true;
  const isScrollable = props.isScrollable ?? false;

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (popoverRef.current && triggerRef.current) {
        if (
          (closeOnClick && !triggerRef.current.contains(event.target)) ||
          (!closeOnClick &&
            !popoverRef.current.contains(event.target) &&
            !triggerRef.current.contains(event.target))
        ) {
          setTimeout(() => {
            setIsVisible(false);
          }, 100);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleScroll = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    handlePosition();
    document.body.style.overflow = 'unset';
    !isScrollable && window.addEventListener('scroll', handleScroll);
    !isScrollable && window.addEventListener('wheel', handleScroll);
    window.addEventListener('resize', handlePosition);

    return () => {
      !isScrollable && window.removeEventListener('scroll', handleScroll);
      !isScrollable && window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('resize', handlePosition);
    };
  }, []);

  return (
    <PopoverContainer onContextMenu={(e) => mouseButton === 2 && e.preventDefault()}>
      <PopoverTrigger
        cursor={cursor}
        ref={triggerRef}
        onMouseDown={(e) => {
          if (content.length !== 0 && e.button === mouseButton) {
            handlePosition();
            setIsVisible(!isVisible);
          }
        }}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        isVisible={isVisible}
        ref={popoverRef}
        popoverPosition={popoverPosition}
        onClick={(e) => {
          closeOnClick ? setIsVisible(false) : setIsVisible(true);
        }}
      >
        {content}
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
  max-height: 30vh;
  overflow-y: auto;
  overflow-x: hidden;
  visibility: ${({ isVisible }) => (isVisible ? `visible` : `hidden`)};
  position: fixed;
  margin-top: 1%;
  background-color: white;
  border: 0.15vw solid black;
  box-shadow: 0 0.3vw 0.8vw rgba(0, 0, 0, 0.7);
  border-radius: 0.45vw;
  z-index: 1000;
  white-space: nowrap;
  max-width: fit-content;
  font-size: 0.6vw;
  top: ${({ popoverPosition }) => popoverPosition.y};
  left: ${({ popoverPosition }) => popoverPosition.x};
`;
