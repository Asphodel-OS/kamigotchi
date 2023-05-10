import React, { useState } from 'react';
import styled from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';
import 'layers/react/styles/font.css';

// MenuButton renders a button that toggles a target modal. It supports a generic
// input of children, though this will usually just be text.
export const MenuButton = (props: Props) => {
  const {
    visibleModals,
    setVisibleModals,
    sound: { volume },
  } = dataStore();

  // toggles the target modal open and closed
  const handleToggle = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    setVisibleModals({ ...visibleModals, [props.targetDiv]: !visibleModals[props.targetDiv] });
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const { id, children, text } = props;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div id={id}>
      <Button
        style={{ pointerEvents: 'auto', display: props.visible ? 'block' : 'none' }}
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        {text && <Tooltip show={showTooltip}>{text}</Tooltip>}
      </Button>
    </div>
  );
};

interface Props {
  id: string;
  targetDiv: keyof VisibleModals;
  children: React.ReactNode;
  text?: string;
  visible: boolean;
}

interface TooltipProps {
  show: boolean;
}

const Tooltip = styled.div<TooltipProps>`
  position: absolute;
  transform: translatey(10px) translateX(-40%);
  padding: 5px;
  background-color: #ffffff;
  font-size: 12px;
  font-family: Pixel;
  opacity: ${(props) => (props.show ? 1 : 0)};
  visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
  transition: all 0.3s ease-in-out;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const Button = styled.button`
  cursor: pointer;

  &:active {
    background-color: #c4c4c4;
  }
  &:hover {
    ${Tooltip} {
      display: block;
    }
  }
  border-radius: 10px;
`;
