import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  content: any;
  cursor?: string;
  mouseButton?: 0 | 2;
  closeOnClick?: boolean;
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
  const [clickedScrollBar, setClickedScrollBar] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (popoverRef.current && triggerRef.current) {
        if (
          (closeOnClick && popoverRef.current.contains(event.target) && !clickedScrollBar) ||
          (!popoverRef.current.contains(event.target) && !triggerRef.current.contains(event.target))
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
      if (x <= width && x >= width - popoverRef.current.scrollWidth) setClickedScrollBar(true);
      else setClickedScrollBar(false);
    }
  };

  const handleScroll = (event: any) => {
    if (popoverRef.current && triggerRef.current) {
      if (
        !popoverRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        console.log('scroll');
        setIsVisible(false);
      }
    }
  };

  useEffect(() => {
    handlePosition();
    // document.body.style.overflow = 'unset';

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('wheel', handleScroll);
    window.addEventListener('resize', handlePosition);

    return () => {
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('wheel', handleScroll);

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
        onMouseDown={(e) => {}}
        onClick={(e) => {
          if (
            e.clientX <= popoverRef.current.getBoundingClientRect().right &&
            e.clientX >=
              popoverRef.current.getBoundingClientRect().right -
                (popoverRef.current.offsetWidth - popoverRef.current.clientWidth)
          )
            setClickedScrollBar(true);
          else setClickedScrollBar(false);

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
  max-height: 20vh;
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
