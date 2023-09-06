import React from 'react';
import styled from 'styled-components';
import { Tooltip } from './Tooltip';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';
import 'layers/react/styles/font.css';

interface Props {
  id: string;
  targetDiv: keyof VisibleModals;
  children: React.ReactNode;
  text: string;
  visible: boolean;
  hideModal?: Partial<VisibleModals>;
}

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

  // catch clicks on modal, prevents duplicate Phaser3 triggers
  const handleClicks = (event: any) => {
    event.stopPropagation();
  };
  const element = document.getElementById(props.id);
  element?.addEventListener('mousedown', handleClicks);

  return (
    <Tooltip text={[text]}>
      <div id={id}>
        <Button
          style={{ pointerEvents: 'auto', display: props.visible ? 'block' : 'none' }}
          onClick={handleToggle}
        >
          {children}
        </Button>
      </div>
    </Tooltip>
  );
};


const Button = styled.button`
  cursor: pointer;
  &:active {
    background-color: #c4c4c4;
  }
  border-radius: 10px;
`;
