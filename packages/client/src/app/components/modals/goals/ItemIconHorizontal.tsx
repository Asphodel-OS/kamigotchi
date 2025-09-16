import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { DetailedEntity } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';

export const ItemIconHorizontal = ({
  item,
  size,
  hoverText,
  balance,
  glow,
  onClick,
  disabled,
  styleOverride,
}: {
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
}) => {
  // layer on a sound effect
  const handleClick = async () => {
    if (onClick) {
      playClick();
      await onClick();
    }
  };

  const setBoxStyles = () => {
    let styles: any = {};
    if (styleOverride?.box) styles = styleOverride.box;

    if (glow) {
      styles.boxShadow = `0 0 0.75rem 0.75rem ${glow}`;
    }

    return styles;
  };

  const setIconStyles = () => {
    let styles: any = {};
    if (styleOverride?.icon) styles = styleOverride.icon;

    return styles;
  };

  // text = x{balance} {item.name}
  const text = `${balance ? `x${balance}` : ''} ${item.name}`;

  const base = () => {
    return (
      <Box style={setBoxStyles()}>
        {onClick ? (
          <ButtonWrapper onClick={handleClick}>
            <Icon style={setIconStyles()} src={item.image} />
          </ButtonWrapper>
        ) : (
          <Icon src={item.image} />
        )}
        <Text>{text}</Text>
      </Box>
    );
  };

  let result = base();

  if (typeof hoverText === 'boolean' && hoverText)
    result = (
      <TextTooltip text={item.description ? [item.name, '', item.description] : [item.name]}>
        {result}
      </TextTooltip>
    );
  else if (typeof hoverText === 'object')
    // object = string array
    result = <TextTooltip text={hoverText}>{result}</TextTooltip>;

  return result;
};

const Box = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  border: solid black 0.1rem;
  border-radius: 0.5rem;

  margin: 0.25rem;
  padding: 0.4rem 0.4rem;
`;

const Icon = styled.img`
  height: 1.5rem;
`;

const Text = styled.p`
  font-size: 0.7rem;
  font-family: Pixel;
  text-align: left;
  color: #444;

  padding: 0 0rem 0 0.3rem;
`;

const ButtonWrapper = styled.div`
  &:hover {
    background-color: #bbb;
  }
`;
