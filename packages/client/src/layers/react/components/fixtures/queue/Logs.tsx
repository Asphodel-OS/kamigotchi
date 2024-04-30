import { EntityIndex, getComponentValueStrict } from '@mud-classic/recs';
import moment from 'moment';
import { useEffect } from 'react';
import styled from 'styled-components';

import { IndicatorIcons } from 'assets/images/icons/indicators';
import { NetworkLayer } from 'layers/network';
import { ActionState, ActionStateString } from 'layers/network/systems/ActionSystem/constants';
import { Tooltip } from 'layers/react/components/library/Tooltip';

interface Props {
  network: NetworkLayer;
  actionIndices: EntityIndex[];
}

export const Logs = (props: Props) => {
  const {
    network: { actions },
    actionIndices,
  } = props;
  const ActionComponent = actions!.Action;

  // scroll to bottom when tx added
  useEffect(() => {
    const logs = document.getElementById('tx-logs');
    if (logs) logs.scrollTop = logs.scrollHeight + 100;
  }, [actionIndices]);

  //////////////////
  // RENDERINGS

  // generate the status icon
  const Status = (status: string, metadata: string) => {
    const icon = statusIcons[status.toLowerCase()];

    let tooltip = [status];
    if (/\S/.test(metadata)) {
      const event = metadata.substring(0, metadata.indexOf(':'));
      const reason = metadata.substring(metadata.indexOf(':') + 1);
      tooltip = [`${status} (${event})`, '', `${reason}`];
    }

    return <Tooltip text={tooltip}>{icon}</Tooltip>;
  };

  // render the human readable description and detailed tooltip of a given action
  const Description = (action: any) => {
    const tooltip = [`Action: ${action.action}`, `Input(s): ${action.params.join(', ')}`];
    return (
      <Tooltip text={tooltip}>
        <Text>{action.description}</Text>
      </Tooltip>
    );
  };

  const Time = (time: number) => {
    return (
      <Tooltip text={[moment(time).format()]}>
        <Text>{moment(time).fromNow()}</Text>
      </Tooltip>
    );
  };

  const Log = (entityIndex: EntityIndex) => {
    const actionData = getComponentValueStrict(ActionComponent, entityIndex);
    let state = ActionStateString[actionData.state as ActionState];
    let metadata = actionData.metadata ?? '';
    return (
      <Row key={`action${entityIndex}`}>
        <RowSection1>
          {Status(state, metadata)}
          {Description(actionData)}
        </RowSection1>
        <RowSection2>{Time(actionData.time)}</RowSection2>
      </Row>
    );
  };

  return <Content id='tx-logs'>{actionIndices.map((entityIndex) => Log(entityIndex))}</Content>;
};

const Content = styled.div`
  border: solid grey 0.14vw;
  border-radius: 10px;

  background-color: #ddd;
  padding: 0.2vw;
  overflow-y: scroll;

  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Row = styled.div`
  padding: 0.2vw;
  height: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  font-family: Pixel;
  font-size: 0.7vw;
  text-align: left;
`;

const RowSection1 = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.2vw;
`;

const RowSection2 = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const Text = styled.div`
  font-size: 0.6vw;
  color: #333;
  text-align: left;
  margin: 0.2vw;
  font-family: Pixel;
`;

const Icon = styled.img`
  width: 1.5vw;
  margin: 0.3vw;
  align-self: center;
`;

// Color coded icon mapping of action queue
type ColorMapping = { [key: string]: any };
const statusIcons: ColorMapping = {
  requested: <Icon src={IndicatorIcons.requested} />,
  executing: <Icon src={IndicatorIcons.executing} />,
  pending: <Icon src={IndicatorIcons.pending} />,
  complete: <Icon src={IndicatorIcons.success} />,
  failed: <Icon src={IndicatorIcons.failure} />,
  canceled: <Icon src={IndicatorIcons.failure} />,
};
