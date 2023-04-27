import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface Props {
  id: string;
  text: string;
  options: Option[];
  disabled?: boolean;
  hidden?: boolean;
  scrollPosition?: number;
}

export interface Option {
  text: string;
  onClick: Function;
}

export function ActionListButton(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && toggleRef.current) {
      const togglePosition = toggleRef.current.getBoundingClientRect();
      setMenuPosition({ top: togglePosition.bottom, left: togglePosition.left });
    }
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [props.scrollPosition]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Container>
      <Toggle ref={toggleRef} id={props.id} onClick={!props.disabled ? toggleMenu : () => {}}>
        {props.text + ' ▾'}
      </Toggle>

      {isOpen && (
        <MenuWrapper style={{ top: menuPosition.top, left: menuPosition.left }}>
          <Menu>
            {props.options.map((option, i) => (
              <Item key={i} onClick={() => option.onClick()}>
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
  display: inline-block;
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
    background-color: #c2c2c2;
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
  margin: 0px 3px;
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
    background-color: #c2c2c2;
  }
`;
