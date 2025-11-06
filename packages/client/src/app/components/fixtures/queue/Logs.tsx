import { EntityIndex, getComponentValueStrict } from 'engine/recs';
import moment from 'moment';
import { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { TxStatusIcons } from 'assets/images/icons/indicators';
import { OpenInNewIcon } from 'assets/images/icons/misc';
import cancelIcon from 'assets/images/icons/actions/cancel.png';
import { DefaultChain } from 'constants/chains';
import { NetworkLayer } from 'network/';
import { ActionState, ActionStateString } from 'network/systems/ActionSystem/constants';

export const Logs = ({
  network,
  actionIndices,
}: {
  network: NetworkLayer;
  actionIndices: EntityIndex[];
}) => {
  const { actions } = network;
  const ActionComponent = actions!.Action;

  // Stable refs to prevent memoized functions from recreating on every render
  const networkRef = useRef(network.network);
  const actionsRef = useRef(actions);
  
  useEffect(() => {
    networkRef.current = network.network;
    actionsRef.current = actions;
  }, [network, actions]);

  // Prevent race conditions when cancelling
  const cancelingTxs = useRef(new Set<string>()).current;
  const cancelingRequests = useRef(new Set<EntityIndex>()).current;

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
          role='button'
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            window.open(`${explorerUrl}/txs/${hash}`, '_blank');
          }}
        />
      </TextTooltip>
    );
  };

  const cancelPendingTx = useMemo(() => async (hash: string) => {
    if (cancelingTxs.has(hash)) {
      console.warn('Cancel already in progress for this transaction');
      return;
    }
    
    cancelingTxs.add(hash);
    
    try {
      const provider = networkRef.current.providers.get()?.json;
      const signer = networkRef.current.signer.get();
      if (!provider || !signer) return console.warn('No provider/signer for cancel');
      const tx = await provider.getTransaction(hash);
      if (!tx) return console.warn('Original tx not found');
      const from = (await signer.getAddress())?.toLowerCase();
      if (tx.from?.toLowerCase() !== from) return console.warn('Not sender of tx');

      const fee = await provider.getFeeData();
      const bump = (v?: bigint) => (v ? (v * 12n) / 10n : undefined);

      const cancelReq: any = {
        to: await signer.getAddress(),
        value: 0,
        nonce: tx.nonce,
      };
      if (tx.maxFeePerGas || fee.maxFeePerGas) {
        // EIP-1559 style
        const baseMaxFee =
          tx.maxFeePerGas && fee.maxFeePerGas
            ? tx.maxFeePerGas > fee.maxFeePerGas
              ? tx.maxFeePerGas
              : fee.maxFeePerGas
            : (tx.maxFeePerGas ?? fee.maxFeePerGas)!;
        const baseTip =
          tx.maxPriorityFeePerGas && fee.maxPriorityFeePerGas
            ? tx.maxPriorityFeePerGas > fee.maxPriorityFeePerGas
              ? tx.maxPriorityFeePerGas
              : fee.maxPriorityFeePerGas
            : (tx.maxPriorityFeePerGas ?? fee.maxPriorityFeePerGas ?? baseMaxFee / 2n)!;
        cancelReq.maxFeePerGas = bump(baseMaxFee);
        cancelReq.maxPriorityFeePerGas = bump(baseTip);
      } else if (tx.gasPrice || fee.gasPrice) {
        // legacy style
        const base =
          tx.gasPrice && fee.gasPrice
            ? tx.gasPrice > fee.gasPrice
              ? tx.gasPrice
              : fee.gasPrice
            : (tx.gasPrice ?? fee.gasPrice)!;
        cancelReq.gasPrice = bump(base);
      } else {
        return console.warn('No fee data available to craft replacement tx');
      }
      await signer.sendTransaction(cancelReq);
    } catch (e) {
      console.warn('Cancel tx failed', e);
    } finally {
      cancelingTxs.delete(hash);
    }
  }, [cancelingTxs]);

  const cancelRequest = useMemo(() => (entity: EntityIndex) => {
    if (cancelingRequests.has(entity)) {
      console.warn('Cancel already in progress for this request');
      return;
    }
    
    cancelingRequests.add(entity);
    
    try {
      actionsRef.current.cancel(entity);
    } catch (e) {
      console.warn('Cancel request failed', e);
    } finally {
      setTimeout(() => cancelingRequests.delete(entity), 500);
    }
  }, [cancelingRequests]);

  const Log = (entity: EntityIndex) => {
    const actionData = getComponentValueStrict(ActionComponent, entity);
    const state = ActionStateString[actionData.state as ActionState];
    const metadata = actionData.metadata ?? '';
    const hash = actionData.txHash as string | undefined;

    // Enable cancellation for pending transactions with a hash
    const isClickable = state === 'Pending' && hash;

    return (
      <Row
        key={`action${entity}`}
        clickable={isClickable}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
        onClick={() => {
          if (isClickable) {
            cancelPendingTx(hash);
          }
        }}
      >
        <RowSegment>
          {Status(state, metadata)}
          {Description(actionData)}
        </RowSegment>
        <RowSegment>
          {Time(actionData.time)}
          {ExplorerButton(hash)}
          {state === 'Requested' && (
            <CancelIcon
              src={cancelIcon}
              alt='Cancel'
              onClick={(e) => {
                e.stopPropagation();
                cancelRequest(entity);
              }}
            />
          )}
        </RowSegment>
      </Row>
    );
  };

  return (
    <Content id='tx-logs'>
      <Row clickable={false} style={{ justifyContent: 'space-evenly' }}>
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

  ${props => props.clickable && `
    background-color: #fafbfc;
    border: 0.05vw solid #e1e8ed;
    border-radius: 0.2vw;
    margin: 0.1vw;
  `}

  &:hover {
    background-color: ${props => props.clickable ? '#e8f4f8' : 'transparent'};
    border-radius: 0.2vw;
    box-shadow: ${props => props.clickable ? 'inset 0 0 0 0.1vw #4a90e2' : 'none'};
  }

  transition: all 0.15s ease;
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
