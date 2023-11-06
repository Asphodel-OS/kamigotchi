import React from 'react';
import styled from 'styled-components';
import { Tooltip } from './Tooltip';

import { dataStore, VisibleModals } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  image: string,
  tooltip: string;
  targetDiv: keyof VisibleModals;
  visible: boolean;
  hideModals?: Partial<VisibleModals>;
}

// MenuButton renders a button that toggles a target modal.
export const MenuButton = (props: Props) => {
  const { visibleModals, setVisibleModals } = dataStore();
  const { id, image, tooltip, targetDiv, hideModals, visible } = props;

  // toggles the target modal open and closed
  const handleToggle = () => {
    playClick();
    const isModalOpen = visibleModals[targetDiv];
    let nextVisibleModals = { ...visibleModals, [targetDiv]: !isModalOpen };
    if (!isModalOpen) nextVisibleModals = { ...nextVisibleModals, ...hideModals };
    setVisibleModals(nextVisibleModals);
  };

  // catch clicks on modal, prevents duplicate Phaser3 triggers
  const handleClicks = (event: any) => {
    event.stopPropagation();
  };
  const element = document.getElementById(id);
  element?.addEventListener('mousedown', handleClicks);

  return (
    <Tooltip text={[tooltip]}>
      <div id={id}>
        <Button
          style={{ display: visible ? 'flex' : 'none' }}
          onClick={handleToggle}
        >
          <Image src={image} alt={id} />
        </Button>
      </div>
    </Tooltip>
  );
};


const Button = styled.button`
  border-radius: 10px;
  cursor: pointer;
  pointer-events: auto;

  &:active {
    background-color: #c4c4c4;
  }
`;

const Image = styled.img`
  height: 100%; 
  width: auto;
`;
