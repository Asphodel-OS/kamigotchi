import styled from "styled-components";

import PlaceHolderIcon from 'assets/images/icons/exit_native.png';
import { NetworkLayer } from "layers/network/types";
import { IconButton } from "layers/react/components/library/IconButton";

interface Props {
  mode: 'collapsed' | 'expanded';
  setMode: Function;
  network: NetworkLayer;
}

export const Controls = (props: Props) => {
  const { mode, setMode } = props;

  const toggleMode = () => {
    setMode(mode === 'collapsed' ? 'expanded' : 'collapsed');
  }

  const getIcon = () => {
    if (mode === 'collapsed') return PlaceHolderIcon;
    return PlaceHolderIcon;
  }

  return (
    <Row>
      <Text>TX Queue</Text>
      <IconButton
        id='toggle'
        onClick={() => toggleMode()}
        img={getIcon()}
      />
    </Row>
  );
}

const Row = styled.div`
  padding: .7vw;
  gap: .7vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-end;
`;

const Text = styled.div`
  font-size: 1vw;
  color: #333;
  text-align: left;
  font-family: Pixel;
`;