import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { NetworkLayer } from "layers/network/types";
import { IconButton } from "../../library/IconButton";


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
    console.log(ExpandLessIcon.muiName);
    if (mode === 'collapsed') return ExpandLessIcon.muiName;
    return ExpandMoreIcon.muiName;
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