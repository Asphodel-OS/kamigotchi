import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore } from 'layers/react/store/createStore';

interface Props {
  id: string;
  text: string;
  options: Option[];
  disabled?: boolean;
  scrollPosition?: number;
}

export interface Option {
  text: string;
  onClick: Function;
}

export function ActionListButton(props: Props) {
  const { sound: { volume } } = dataStore();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [props.scrollPosition]);

  const toggleMenu = (e) => {
    const togglePosition = toggleRef.current?.getBoundingClientRect();
    const screenHeight = window.innerHeight;
    const targetHeight = (e.target as HTMLElement).clientHeight;

    if (togglePosition) {
      if (togglePosition.bottom + targetHeight > screenHeight * 0.7) {
        setMenuPosition({ top: togglePosition.bottom * 0.85, left: togglePosition.left });
      } else {
        setMenuPosition({ top: togglePosition.bottom, left: togglePosition.left });
      }
    }
    setIsOpen(!isOpen);
  };

  // close the menu and layer in a sound effect
  const onSelect = (option: Option) => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    option.onClick();
    setIsOpen(false);
  }

  const setStyles = () => {
    var styles: any = {};
    if (props.disabled) styles.backgroundColor = '#b2b2b2';
    return styles;
  };

  return (
    <Container>
      <Toggle
        ref={toggleRef}
        id={props.id}
        onClick={!props.disabled ? (e) => toggleMenu(e) : () => { }}
        style={setStyles()}
      >
        {props.text + ' ▾'}
      </Toggle>

      {isOpen && (
        <MenuWrapper style={{ top: menuPosition.top, left: menuPosition.left }}>
          <Menu>
            {props.options.map((option, i) => (
              <Item key={i} onClick={() => onSelect(option)}>
                {option.text}
              </Item>
            ))}
          </Menu>
        </MenuWrapper>
      )}
    </Container>
  );
}

const Container = styled.div``;

const Toggle = styled.button`
  background-color: #ffffff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  display: flex;
  margin: 3px;

  font-family: Pixel;
  font-size: 14px;
  justify-content: center;
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #e8e8e8;
  }
  &:active {
    background-color: #c4c4c4;
  }
`;

const MenuWrapper = styled.div`
  position: absolute;
  z-index: 1;
`;

const Menu = styled.div`
  background-color: #ffffff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  padding: 0px 3px;
  min-width: 100px;
`;

const Item = styled.div`
  padding: 8px 10px;
  justify-content: left;
  font-family: Pixel;
  font-size: 14px;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #e8e8e8;
  }
  &:active {
    background-color: #c4c4c4;
  }
`;
