import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { EntityIndex, getComponentEntities, getComponentValueStrict } from 'engine/recs';
import { ActionState, ActionStateString } from 'network/systems/ActionSystem';
import { useStream } from 'network/utils/hooks';
import { getBigger } from 'utils/numbers/bigint';
import { LOG_HEIGHTS } from './constants';
import { Controls } from './controls';
import { Logs } from './logs';

export const ActionQueue: UIComponent = {
  id: 'ActionQueue',
  Render: () => {
    const { network } = useLayers();

    const {
      actions,
      network: { providers, signer },
    } = network;
    const provider = providers.get()?.json;
    const ActionComponent = actions!.Action;
    const actionUpdate = useStream(ActionComponent.update$);

    const isFixtureVisible = useVisibility((s) => s.fixtures.actionQueue);
    const [mode, setMode] = useState<number>(1);
    const [actionIndices, setActionIndices] = useState<EntityIndex[]>([]);
    const [tick, setTick] = useState(Date.now());

    /////////////////
    // SUBSCRIPTIONS

    // set ticking on mount
    useEffect(() => {
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, 1000);
      return () => clearInterval(timerId);
    }, []);

    // track the full list of Actions by their Entity Index
    useEffect(() => {
      setActionIndices([...getComponentEntities(ActionComponent)]);
    }, [actionUpdate]);

    /////////////////
    // ACTIONS

    // Attempt to cancel a pending on-chain tx via replacement (same nonce, higher fee)
    // NOTE: this is never used in production. initia's miniEVM does not support it
    const cancelPendingTx = async (hash: string) => {
      if (!provider || !signer) return console.warn('No provider/signer for cancel');

      try {
        const tx = await provider.getTransaction(hash);
        if (!tx) return console.warn('Original tx not found');
        const from = (await signer.getAddress())?.toLowerCase();
        if (tx.from?.toLowerCase() !== from) return console.warn('Not sender of tx');

        // fetch current provider fee data as fallback
        const pFee = await provider.getFeeData();
        const bump = (v: bigint) => (v * 6n) / 5n; // +20%

        // create cancel request
        const cancelReq: any = {
          to: await signer.getAddress(),
          value: 0,
          nonce: tx.nonce,
        };

        // determine fee for cancel request
        if (tx.maxFeePerGas || pFee.maxFeePerGas) {
          // EIP-1559 style
          const baseMaxFee = getBigger(tx.maxFeePerGas ?? 0n, pFee.maxFeePerGas ?? 0n);
          const basePriorityFee = getBigger(
            tx.maxPriorityFeePerGas ?? 0n,
            pFee.maxPriorityFeePerGas ?? 0n
          );
          const baseTip = basePriorityFee !== 0n ? basePriorityFee : baseMaxFee / BigInt(2); // fallback to half of max fee
          cancelReq.maxFeePerGas = bump(baseMaxFee);
          cancelReq.maxPriorityFeePerGas = bump(baseTip);
        } else if (tx.gasPrice || pFee.gasPrice) {
          // legacy style
          const base = getBigger(tx.gasPrice ?? 0n, pFee.gasPrice ?? 0n);
          cancelReq.gasPrice = bump(base);
        } else {
          return console.warn('No fee data available to craft replacement tx');
        }

        // attempt to send the cancel request
        await signer.sendTransaction(cancelReq);
      } catch (e) {
        console.warn('Cancel tx failed', e);
      }
    };

    // For Requested/Executing: mark canceled and, if a tx hash appears shortly after,
    // automatically send a cancel replacement.
    const cancelRequest = async (entity: EntityIndex) => {
      try {
        actions.cancel(entity);

        // Poll briefly for a hash if execution already started
        const deadline = Date.now() + 5000; // 5s timeout - shorter for better UX
        while (Date.now() < deadline) {
          const data = getComponentValueStrict(ActionComponent, entity);
          const hash = data.txHash as string | undefined;
          const state = ActionStateString[data.state as ActionState];
          if (['Complete', 'Failed', 'Canceled'].includes(state)) break;
          if (hash && state !== 'Complete') {
            await cancelPendingTx(hash);
            break;
          }
          await new Promise((r) => setTimeout(r, 500)); // Poll every 500ms instead of 200ms
        }
      } catch (e) {
        console.warn('Cancel request/tx failed', e);
      }
    };

    /////////////////
    // RENDER

    return (
      <Container style={{ display: isFixtureVisible ? 'block' : 'none' }}>
        <Content style={{ pointerEvents: 'auto', maxHeight: LOG_HEIGHTS[mode] }}>
          <Logs
            actionIndices={actionIndices}
            network={network}
            state={{ tick }}
            utils={{ cancelPendingTx, cancelRequest }}
            isVisible={mode !== 0}
          />
          <Controls mode={mode} setMode={setMode} />
        </Content>
      </Container>
    );
  },
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: left;
  user-select: none;
`;

// cancer. just absolute cancer
const Content = styled.div`
  position: absolute;
  padding: 0.2vw;

  right: 1.33vw;
  width: 32.66vw;
  max-width: 32.66vw;

  bottom: 1.7vh;
  max-height: 23vh;

  border: solid black 0.15vw;
  border-radius: 0.6vw;

  background-color: white;
  display: flex;
  flex-flow: column nowrap;
`;
