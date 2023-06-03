import React, { useState } from 'react';
import styled from 'styled-components';
import { Tooltip, TooltipContainer } from './Tooltip';

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
  const { id, children, text, hideModal } = props;

  // toggles the target modal open and closed
  const handleToggle = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    const toggleModal = hideModal ? hideModal : {};

    setVisibleModals({
      ...visibleModals,
      ...toggleModal,
      [props.targetDiv]: !visibleModals[props.targetDiv],
    });
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

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
        {text && <Tooltip show={showTooltip} text={text} positionTop='-5px' />}
      </Button>
    </div>
  );
};

interface Props {
  id: string;
  targetDiv: keyof VisibleModals;
  children: React.ReactNode;
  visible: boolean;
  text?: string;
  hideModal?: Partial<VisibleModals>;
}

const Button = styled.button`
  cursor: pointer;

  &:active {
    background-color: #c4c4c4;
  }
  &:hover {
    ${TooltipContainer} {
      display: block;
    }
  }
  border-radius: 10px;
`;
