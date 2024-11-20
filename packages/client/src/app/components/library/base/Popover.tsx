import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  content: any;
}

const Popover = (props: Props) => {
  const { children, content } = props;
  const [isVisible, setIsVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(document.createElement('div'));
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

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
    const popoverWidth = popoverRef.current?.offsetWidth || 0;
    const popoverHeight = popoverRef.current?.offsetHeight || 0;
    const childrenPosition = triggerRef.current?.getBoundingClientRect();
    if (childrenPosition) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let positionX = childrenPosition.right;
      let positionY = childrenPosition.bottom - 10;
      if (positionX + popoverWidth + 10 > viewportWidth) {
        positionX = childrenPosition.right - popoverWidth - 10;
      }
      if (positionY + popoverHeight + 10 > viewportHeight) {
        positionY = childrenPosition.bottom - popoverHeight - 10;
      }
      setTooltipPosition({ x: positionX, y: positionY });
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
    <PopoverContainer>
      <PopoverTrigger
        ref={triggerRef}
        onClick={(e) => {
          handlePosition();
          setIsVisible(!isVisible);
        }}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        isVisible={isVisible}
        ref={popoverRef}
        tooltipPosition={tooltipPosition}
        onClick={(e) => {
          setIsVisible(false);
        }}
      >
        {content}
      </PopoverContent>
    </PopoverContainer>
  );
};

export default Popover;
const PopoverContainer = styled.div`
  display: flex;
  position: relative;
`;

const PopoverTrigger = styled.div`
  border: none;
  padding: 0px;
  cursor: pointer;
  border-radius: 30px;
`;
const PopoverContent = styled.div<{
  position?: string[];
  dimensions?: any;
  isVisible?: boolean;
  tooltipPosition: any;
}>`
  ${({ isVisible }) => (isVisible ? `visibility: visible;` : `visibility:hidden;`)};
  position: fixed;
  margin-top: 10px;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  z-index: 1000;
  white-space: nowrap;
  max-width: fit-content;
  top: ${({ tooltipPosition }) => tooltipPosition.y};
  left: ${({ tooltipPosition }) => tooltipPosition.x};
`;
