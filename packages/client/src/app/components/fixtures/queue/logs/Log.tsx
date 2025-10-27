import styled from 'styled-components';

import { Text, TextTooltip } from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import { TxStatusIcons } from 'assets/images/icons/indicators';
import { OpenInNewIcon } from 'assets/images/icons/misc';
import { EntityIndex, getComponentValueStrict } from 'engine/recs';
import { NetworkLayer } from 'network/';
import { ActionState, ActionStateString } from 'network/systems/ActionSystem';
import { getDateString, getTimeDeltaString } from 'utils/time';
import { EXPLORER_URL } from '../constants';

export const Log = ({
  network,
  entity,
  state,
  utils,
}: {
  network: NetworkLayer;
  entity: EntityIndex;
  state: { tick: number };
  utils: {
    cancelRequest: (entity: EntityIndex) => Promise<void>;
    cancelPendingTx: (hash: string) => Promise<void>;
  };
}) => {
  const { cancelRequest, cancelPendingTx } = utils;
  const ActionComponent = network.actions!.Action;
  const actionData = getComponentValueStrict(ActionComponent, entity);
  const { tick } = state;

  const command = actionData.action ?? 'Unknown System';
  const description = actionData.description;
  const hash = actionData.txHash as string | undefined;
  const metadata = actionData.metadata ?? '';
  const params = actionData.params ?? [];
  const actionState = ActionStateString[actionData.state as ActionState];
  const time = actionData.time;
  const canCancel = actionState === 'Pending' && !!hash;

  //////////////////
  // INTERPRETATION

  // generate the status tooltip depending on the tx state and metadata
  // TODO: fix this to be more robust
  const getStatusTooltip = (status: string, metadata: string) => {
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

    return status === 'Complete' ? [status] : [`${status} (${event})`, '', details];
  };

  // get the tooltip of the desription of an action log
  const getDescriptionTooltip = (command: string, params: string[]) => {
    const tooltip = [command].concat(params.map((p) => `→ ${p}`));
    return tooltip;
  };

  /////////////////
  // RENDER

  return (
    <Container
      key={`action${entity}`}
      isClickable={canCancel}
      style={{ cursor: canCancel ? 'pointer' : 'default' }}
      onClick={() => canCancel && cancelPendingTx(hash)}
    >
      <Left>
        <TextTooltip text={getStatusTooltip(actionState, metadata)}>
          {statusIcons[actionState.toLowerCase()]}
        </TextTooltip>
        <TextTooltip text={getDescriptionTooltip(command, params)} alignText='left'>
          <Text size={0.6}>{description}</Text>
        </TextTooltip>
      </Left>
      <Right>
        <TextTooltip text={[getDateString(time)]}>
          <Text size={0.6}>{getTimeDeltaString((tick - time) / 1000)}</Text>
        </TextTooltip>
        {!!hash && (
          <TextTooltip text={[`View on block explorer`]}>
            <OpenIcon
              src={OpenInNewIcon}
              role='button'
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                window.open(`${EXPLORER_URL}/tx/${hash}`, '_blank');
              }}
            />
          </TextTooltip>
        )}
        {actionState === 'Requested' && (
          <TextTooltip text={['Cancel this queued tx before it sends']}>
            <CancelIcon
              src={ActionIcons.cancel}
              alt='Cancel Transaction'
              onClick={(e) => {
                e.stopPropagation();
                cancelRequest(entity);
              }}
            />
          </TextTooltip>
        )}
      </Right>
    </Container>
  );
};

const Container = styled.div<{ isClickable?: boolean }>`
  padding: 0.2vw;
  height: 100%;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const Left = styled.div`
  width: 21vw;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3vw;
`;

const Right = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3vw;
`;

const OpenIcon = styled.img.attrs({ alt: 'Open in explorer' })`
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

const CancelIcon = styled.img`
  cursor: pointer;
  width: 1.6vw;
  height: 1.6vw;
  margin-left: 0.3vw;
  filter: drop-shadow(0 0 0.1vw rgba(0, 0, 0, 0.4));
  &:hover {
    opacity: 0.9;
  }
  &:active {
    opacity: 0.8;
  }
`;

// Color coded icon mapping of action queue
type ColorMapping = { [key: string]: any };
const statusIcons: ColorMapping = {
  requested: <Icon src={TxStatusIcons.requested} />,
  executing: <Icon src={TxStatusIcons.executing} />,
  // Use the regular orange icon for pending instead of yellow
  pending: <Icon src={TxStatusIcons.executing} />,
  complete: <Icon src={TxStatusIcons.success} />,
  failed: <Icon src={TxStatusIcons.failure} />,
  canceled: <Icon src={TxStatusIcons.canceled} />,
};
