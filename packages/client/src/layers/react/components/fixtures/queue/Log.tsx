import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import { NetworkLayer } from "layers/network/types";
import styled from "styled-components";
import { ActionStateString, ActionState } from 'layers/network/ActionSystem/constants';


// Color coding of action queue
type ColorMapping = { [key: string]: string };
const statusColors: ColorMapping = {
  "pending": "orange",
  "failed": "red",
  "complete": "green",
}

interface Props {
  network: NetworkLayer;
}

export const Log = (props: Props) => {
  const { network: { world, actions } } = props;
  const ActionComponent = actions!.Action;

  const StyledStatus = (status: string, metadata: string) => {
    const text = status.toLowerCase();
    const color = statusColors[text];
    const reason = metadata.substring(metadata.indexOf(":") + 1);
    return (
      <div>
        <Description style={{ color: `${color}`, display: "inline" }}>
          {text}
        </Description>
        <Description style={{ color: `FF7777` }}>
          {reason}
        </Description>
      </div>
    );
  }

  const TxQueue = () => (
    [...getComponentEntities(ActionComponent)].map((entityIndex) => {
      const actionData = getComponentValueStrict(ActionComponent, entityIndex);
      let state = ActionStateString[actionData.state as ActionState];
      let metadata = actionData.metadata ? actionData.metadata : "";
      return (
        <Description key={`action${entityIndex}`}>
          {world.entities[entityIndex]}: {StyledStatus(state, metadata as string)}
        </Description>
      );
    })
  );

  return (
    <Content>
      {TxQueue()}
    </Content>
  );
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;

  overflow-y: scroll;
  max-height: 300px;
`;

const Description = styled.div`
  font-size: .7vw;
  color: #333;
  text-align: left;
  padding: 2px;
  font-family: Pixel;
`;