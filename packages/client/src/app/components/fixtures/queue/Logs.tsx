import { EntityIndex, getComponentValueStrict } from '@mud-classic/recs';
import moment from 'moment';
import { useEffect } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { IndicatorIcons } from 'assets/images/icons/indicators';
import { OpenInNewIcon } from 'assets/images/icons/misc';
import { DefaultChain } from 'constants/chains';
import { NetworkLayer } from 'network/';
import { ActionState, ActionStateString } from 'network/systems/ActionSystem/constants';

export const Logs = ({
  network: {
    actions,
  },
  actionIndices,
}: {
  network: NetworkLayer;
  actionIndices: EntityIndex[];
}) => {
  const ActionComponent = actions!.Action;

  // scroll to bottom when tx added
  useEffect(() => {
    const logs = document.getElementById('tx-logs');
    if (logs) logs.scrollTop = logs.scrollHeight + 1000;
  }, [actionIndices]);

  //////////////////
  // RENDERINGS

  // generate the status icon
  const Status = (status: string, metadata: string) => {
    const icon = statusIcons[status.toLowerCase()];

    let event = '';
    let details = metadata;
    if (/\S/.test(metadata)) {
      const bodyStart = metadata.indexOf('body=');
      const errorStart = metadata.indexOf('error='); // used to determine end of body segment
      if (bodyStart != -1 && errorStart != -1) {
        let response: any;
        try {
          const body = metadata.substring(bodyStart + 6, errorStart - 3).replaceAll('\\"', '"');
          response = JSON.parse(body);
        } catch (e) {
          const body = metadata.substring(bodyStart + 6, errorStart - 5).replaceAll('\\"', '"');
          response = JSON.parse(body);
        }

        const responseMessage = response?.error?.message ?? response?.message;
        const splitIndex = responseMessage.indexOf(':');
        if (splitIndex != -1) {
          event = responseMessage.substring(0, splitIndex);
          details = responseMessage.substring(splitIndex + 1);
        } else {
          details = responseMessage;
        }
      }
    }

    const tooltip = status === 'Complete' ? [status] : [`${status} (${event})`, '', details];
    return <TextTooltip text={tooltip}>{icon}</TextTooltip>;
  };

  // render the human readable description and detailed tooltip of a given action
  const Description = (action: any) => {
    const tooltip = [`Action: ${action.action}`, `Input(s): ${action.params.join(', ')}`];
    return (
      <TextTooltip text={tooltip}>
        <Text>{action.description}</Text>
      </TextTooltip>
    );
  };

  const Time = (time: number) => {
    return (
      <TextTooltip text={[moment(time).format('Do MMMM, h:mm:ss a')]}>
        <Text>{moment(time).fromNow()}</Text>
      </TextTooltip>
    );
  };

  const ExplorerButton = (hash: string | undefined) => {
    const explorerUrl = DefaultChain?.blockExplorers?.default?.url ?? '';
    if (!hash || !explorerUrl) return <></>;

    return (
      <TextTooltip text={[`View on block explorer`]}>
        <OpenIcon
          src={OpenInNewIcon}
          onClick={() => window.open(`${explorerUrl}/txs/${hash}`, '_blank')}
        />
      </TextTooltip>
    );
  };

  const Log = (entity: EntityIndex) => {
    const actionData = getComponentValueStrict(ActionComponent, entity);
    const state = ActionStateString[actionData.state as ActionState];
    const metadata = actionData.metadata ?? '';

    return (
      <Row key={`action${entity}`}>
        <RowSegment>
          {Status(state, metadata)}
          {Description(actionData)}
        </RowSegment>
        <RowSegment>
          {Time(actionData.time)}
          {ExplorerButton(actionData.txHash)}
        </RowSegment>
      </Row>
    );
  };

  return (
    <Content id='tx-logs'>
      <Row style={{ justifyContent: 'space-evenly' }}>
        <Bar />
        <Text>TxQueue</Text>
        <Bar />
      </Row>
      {actionIndices.map((entity) => Log(entity))}
    </Content>
  );
};

const Content = styled.div`
  border: solid grey 0.14vw;
  border-radius: 0.4vw;

  background-color: #ddd;
  margin: 0.2vw;
  padding: 0.2vw;
  overflow-y: auto;

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
`;

const RowSegment = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.2vw;
`;

const Bar = styled.div`
  border-top: 0.1vw solid #888;
  width: 40%;
  padding: 0.1vw;
`;

const Text = styled.div`
  color: #333;
  margin: 0.2vw;

  font-family: Pixel;
  font-size: 0.6vw;
  line-height: 0.9vw;
  text-align: left;
`;

const OpenIcon = styled.img`
  cursor: pointer;

  width: 1.5vw;
  margin-right: 0.4vw;

  &:hover {
    opacity: 0.8;
  }
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
