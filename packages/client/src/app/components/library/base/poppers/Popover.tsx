import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  content: any;
  cursor?: string;
  clickMouse?: 0 | 2;
}

export const Popover = (props: Props) => {
  const { children, content } = props;
  const [isVisible, setIsVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(document.createElement('div'));
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const cursor = props.cursor ?? 'pointer';
  const clickMouse = props.clickMouse ?? 0;

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (popoverRef.current && triggerRef.current) {
        if (
          !popoverRef.current.contains(event.target) &&
          !triggerRef.current.contains(event.target)
        ) {
          setIsVisible(false);
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
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('wheel', handleScroll);
    window.addEventListener('resize', handlePosition);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('resize', handlePosition);
    };
  }, []);

  return (
    <PopoverContainer onContextMenu={(e) => e.preventDefault()}>
      <PopoverTrigger
        cursor={cursor}
        ref={triggerRef}
        contextMenu='return false;'
        onMouseDown={(e) => {
          if (content.length !== 0 && e.button === clickMouse) {
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
        onMouseDown={(e) => {
          setIsVisible(false);
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
