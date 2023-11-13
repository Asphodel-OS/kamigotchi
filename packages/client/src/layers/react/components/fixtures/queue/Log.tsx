import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import moment from 'moment';

import { NetworkLayer } from "layers/network/types";
import { ActionStateString, ActionState } from 'layers/network/ActionSystem/constants';
import { Tooltip } from "layers/react/components/library/Tooltip";

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

  const getTimeString = (time: number) => {
    return moment(time).fromNow();
  }

  const Status = (status: string, metadata: string) => {
    const text = status.toLowerCase();
    const color = statusColors[text];
    const reason = metadata.substring(metadata.indexOf(":") + 1);
    return (
      <Tooltip text={[reason]}>
        <Text style={{ color: `${color}`, display: "inline" }}>
          {text}
        </Text>
      </Tooltip>
    );
  }

  const Description = (action: any) => {
    const tooltip = [
      `Action: ${action.action}`,
      `Input(s): ${action.params.join(", ")}`,
    ]
    return (
      <Tooltip text={tooltip}>
        <Text>
          {action.description}
        </Text>
      </Tooltip>
    );
  }

  const Time = (time: number) => {
    return (
      <Tooltip text={[moment(time).format()]}>
        <Text>
          {getTimeString(time)}
        </Text>
      </Tooltip>
    );
  }

  const TxQueue = () => (
    [...getComponentEntities(ActionComponent)].map((entityIndex) => {
      const actionData = getComponentValueStrict(ActionComponent, entityIndex);
      let state = ActionStateString[actionData.state as ActionState];
      let metadata = actionData.metadata ?? '';
      return (
        <Row key={`action${entityIndex}`}>
          {Status(state, metadata)}
          {Description(actionData)}
          {Time(actionData.time)}
        </Row>
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
  background-color: #ddd;
  border-radius: 10px;
  padding: 1vw;
  border: solid grey 2px;

  overflow-y: scroll;
`;

const Row = styled.div`
  padding: .2vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  font-family: Pixel;
  font-size: .7vw;
  text-align: left;
`;


const Text = styled.div`
  font-size: .7vw;
  color: #333;
  text-align: left;
  padding: 2px;
  font-family: Pixel;
`;