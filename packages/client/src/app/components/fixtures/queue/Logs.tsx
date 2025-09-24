import { EntityIndex, getComponentValueStrict } from '@mud-classic/recs';
import { BigNumber } from 'ethers';
import moment from 'moment';
import { useEffect } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { IndicatorIcons } from 'assets/images/icons/indicators';
import { OpenInNewIcon } from 'assets/images/icons/misc';
import cancelSketch from 'assets/images/icons/queue/cancel_sketch.png';
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
            window.open(`${explorerUrl}/tx/${hash}`, '_blank');
          }}
        />
      </TextTooltip>
    );
  };

  // Attempt to cancel a pending on-chain tx via replacement (same nonce, higher fee)
  const cancelPendingTx = async (hash: string) => {
    try {
      const provider = network.network.providers.get()?.json;
      const signer = network.network.signer.get();
      if (!provider || !signer) return console.warn('No provider/signer for cancel');
      const tx = await provider.getTransaction(hash);
      if (!tx) return console.warn('Original tx not found');
      const from = (await signer.getAddress())?.toLowerCase();
      if (tx.from?.toLowerCase() !== from) return console.warn('Not sender of tx');

      // fetch current fee data to build a valid replacement on this chain
      const fee = await provider.getFeeData();
      const bump = (v?: BigNumber) => (v ? v.mul(12).div(10) : undefined); // +20%

      const cancelReq: any = {
        to: await signer.getAddress(),
        value: 0,
        nonce: tx.nonce,
      };
      if (tx.maxFeePerGas || fee.maxFeePerGas) {
        // EIP-1559 style
        const baseMaxFee =
          tx.maxFeePerGas && fee.maxFeePerGas
            ? tx.maxFeePerGas.gt(fee.maxFeePerGas)
              ? tx.maxFeePerGas
              : fee.maxFeePerGas
            : (tx.maxFeePerGas ?? fee.maxFeePerGas)!;
        const baseTip =
          tx.maxPriorityFeePerGas && fee.maxPriorityFeePerGas
            ? tx.maxPriorityFeePerGas.gt(fee.maxPriorityFeePerGas)
              ? tx.maxPriorityFeePerGas
              : fee.maxPriorityFeePerGas
            : (tx.maxPriorityFeePerGas ?? fee.maxPriorityFeePerGas ?? baseMaxFee.div(2))!;
        cancelReq.maxFeePerGas = bump(baseMaxFee);
        cancelReq.maxPriorityFeePerGas = bump(baseTip);
      } else if (tx.gasPrice || fee.gasPrice) {
        // legacy style
        const base =
          tx.gasPrice && fee.gasPrice
            ? tx.gasPrice.gt(fee.gasPrice)
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
    }
  };

  // For Requested/Executing: mark canceled and, if a tx hash appears shortly after,
  // automatically send a cancel replacement.
  const cancelRequestOrTx = async (entity: EntityIndex) => {
    try {
      actions.cancel(entity);
      // Poll briefly for a hash if execution already started
      const deadline = Date.now() + 45000; // 45s window for slow networks
      while (Date.now() < deadline) {
        const data = getComponentValueStrict(ActionComponent, entity);
        const h = data.txHash as string | undefined;
        const state = ActionStateString[data.state as ActionState];
        if (['Complete', 'Failed', 'Canceled'].includes(state)) break;
        if (h && state !== 'Complete') {
          await cancelPendingTx(h);
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (e) {
      console.warn('Cancel request/tx failed', e);
    }
  };

  const Log = (entity: EntityIndex) => {
    const actionData = getComponentValueStrict(ActionComponent, entity);
    const state = ActionStateString[actionData.state as ActionState];
    const metadata = actionData.metadata ?? '';
    const hash = actionData.txHash as string | undefined;

    return (
      <Row
        key={`action${entity}`}
        style={{ cursor: state === 'Pending' && hash ? 'pointer' : 'default' }}
        onClick={() => {
          if (state === 'Pending' && hash) {
            if (confirm('Replace pending tx with a cancel tx?')) cancelPendingTx(hash);
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
          {state === 'Pending' && hash && (
            <TextTooltip text={[`Replace with a 0-value tx (same nonce) to cancel.`]}>
              <CancelIcon
                src={cancelSketch}
                alt='Cancel Tx'
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Cancel this pending transaction?')) cancelPendingTx(hash);
                }}
              />
            </TextTooltip>
          )}
          {(state === 'Requested' || state === 'Executing') && (
            <TextTooltip
              text={[
                state === 'Requested'
                  ? 'Remove this queued request before it sends'
                  : 'Stop this request before the tx is submitted',
              ]}
            >
              <CancelIcon
                src={cancelSketch}
                alt='Cancel'
                onClick={(e) => {
                  e.stopPropagation();
                  cancelRequestOrTx(entity);
                }}
              />
            </TextTooltip>
          )}
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
  requested: <Icon src={IndicatorIcons.requested} />,
  executing: <Icon src={IndicatorIcons.executing} />,
  // Use the regular orange icon for pending instead of yellow
  pending: <Icon src={IndicatorIcons.executing} />,
  complete: <Icon src={IndicatorIcons.success} />,
  failed: <Icon src={IndicatorIcons.failure} />,
  canceled: <Icon src={IndicatorIcons.canceled} />,
};
