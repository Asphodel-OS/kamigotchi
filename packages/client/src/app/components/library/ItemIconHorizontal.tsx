import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { DetailedEntity } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';

interface Props {
  item: DetailedEntity;
  size: 'small' | 'large' | 'fixed';
  hoverText?: boolean | string[];
  balance?: number;
  glow?: string;
  onClick?: Function;
  disabled?: boolean;
  styleOverride?: {
    box?: any;
    icon?: any;
  };
}

export const ItemIconHorizontal = (props: Props) => {
  // layer on a sound effect
  const handleClick = async () => {
    if (props.onClick) {
      playClick();
      await props.onClick();
    }
  };

  const setBoxStyles = () => {
    let styles: any = {};
    if (props.styleOverride?.box) styles = props.styleOverride.box;

    if (props.glow) {
      styles.boxShadow = `0 0 0.75vw 0.75vw ${props.glow}`;
    }

    return styles;
  };

  const setIconStyles = () => {
    let styles: any = {};
    if (props.styleOverride?.icon) styles = props.styleOverride.icon;

    return styles;
  };

  // text = x{balance} {item.name}
  const text = `${props.balance ? `x${props.balance}` : ''} ${props.item.name}`;

  const base = () => {
    return (
      <Box style={setBoxStyles()}>
        {props.onClick ? (
          <ButtonWrapper onClick={handleClick}>
            <Icon style={setIconStyles()} src={props.item.image} />
          </ButtonWrapper>
        ) : (
          <Icon src={props.item.image} />
        )}
        <Text>{text}</Text>
      </Box>
    );
  };

  let result = base();

  if (typeof props.hoverText === 'boolean' && props.hoverText)
    result = (
      <Tooltip
        text={
          props.item.description ? [props.item.name, '', props.item.description] : [props.item.name]
        }
      >
        {result}
      </Tooltip>
    );
  else if (typeof props.hoverText === 'object')
    // object = string array
    result = <Tooltip text={props.hoverText}>{result}</Tooltip>;

  return result;
};

const Box = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  border: solid black 0.1vw;
  border-radius: 0.5vw;

  margin: 0.25vw;
  padding: 0.4vh 0.4vw;
`;

const Icon = styled.img`
  height: 1.5vw;
`;

const Text = styled.p`
  font-size: 0.7vw;
  font-family: Pixel;
  text-align: left;
  color: #444;

  padding: 0 0vw 0 0.3vw;
`;

const ButtonWrapper = styled.div`
  &:hover {
    background-color: #bbb;
  }
`;
