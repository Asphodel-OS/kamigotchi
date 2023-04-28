import React from 'react';
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

  return (
    <Wrapper id={props.id}>
      <Content>
        <Button style={{ pointerEvents: 'auto' }} onClick={handleToggle}>
          {props.children}
        </Button>
      </Content>
    </Wrapper>
  );
}

interface Props {
  id: string;
  targetDiv: keyof VisibleModals;
  children: React.ReactNode;
}

const Wrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  display: block;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  padding: 8px;
`;

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  font-family: Pixel;

  &:active {
    background-color: #c4c4c4;
  }
`;