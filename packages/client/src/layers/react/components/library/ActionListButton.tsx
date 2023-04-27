import styled from 'styled-components';

interface Props {
  id: string;
  text: string;
  options: Option[];
  disabled?: boolean;
  // size?: 'sm' | 'md' | 'lg';
}

export interface Option {
  text: string;
  onClick: Function;
}

export function ActionListButton(props: Props) {

  const toggleMenu = () => {
    var menu = document.getElementById(`feed-menu-${props.id}`);
    if (!menu) return;

    menu.style.display = (menu.style.display === "none") ? "block" : "none";
  }

  return (
    <Container>
      <Toggle
        id={props.id}
        onClick={!props.disabled ? toggleMenu : () => { }}
      >
        {props.text + ' ▾'}
      </Toggle>

      <Menu id={`feed-menu-${props.id}`}>
        {props.options.map((option, i) => (
          <Item id={i.toString()} onClick={() => option.onClick()}>
            {option.text}
          </Item>
        ))}
      </Menu>
    </Container>
  );
}

export default ActionListButton;

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

const Menu = styled.div`
  display: none;

  background-color: #ffffff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  margin: 0px 3px;
  position: absolute;
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
}

`;