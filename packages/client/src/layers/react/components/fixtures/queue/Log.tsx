import { getComponentEntities, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import moment from 'moment';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from '@mui/icons-material/Cancel';

import { NetworkLayer } from "layers/network/types";
import { ActionStateString, ActionState } from 'layers/network/ActionSystem/constants';
import { Tooltip } from "layers/react/components/library/Tooltip";

// Color coded icon mapping of action queue
type ColorMapping = { [key: string]: any };
const statusIcons: ColorMapping = {
  "executing": <PendingIcon style={{ color: 'yellow' }} />,
  "pending": <PendingIcon style={{ color: 'orange' }} />,
  "complete": <CheckCircleIcon style={{ color: 'green' }} />,
  "failed": <ErrorIcon style={{ color: 'red' }} />,
  "cancelled": <CancelIcon style={{ color: 'red' }} />,
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

  // generate the status icon
  const Status = (status: string, metadata: string) => {
    const icon = statusIcons[status.toLowerCase()];

    let tooltip = [status];
    if (metadata) {
      const event = metadata.substring(0, metadata.indexOf(":"));
      const reason = metadata.substring(metadata.indexOf(":") + 1);
      tooltip = [`${status} (${event})`, '', `${reason}`]
    }

    return (<Tooltip text={tooltip}>{icon}</Tooltip>);
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