import { useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { formatEther, parseEther } from 'viem';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useNetwork, useVisibility } from 'app/stores';
import { getInjectedWallet } from 'app/utils';
import { MenuIcons } from 'assets/images/icons/menu';
import { DEAD_ADDRESS } from 'constants/addresses';
import { BridgeForm } from './BridgeForm';
import { BridgeUpdates } from './BridgeUpdates';
import { BRIDGE_OPEN_REQUEST_EVENT, isBridgeOpenDetail } from './helpers/api';
import {
  BridgeDirection,
  DISABLED_SOURCE_CHAIN_IDS,
  EVMChainOption,
  SOURCE_CHAIN_OPTIONS,
} from './helpers/constants';
import { useBridgeOrchestration } from './helpers/useBridgeOrchestration';

export const BridgeModal: UIComponent = {
  id: 'BridgeModal',
  Render: () => {
    /////////////////
    // PREPARATION

    const isOpen = useVisibility((s) => s.modals.bridge);
    const setBridgeProcessActive = useVisibility((s) => s.setBridgeProcessActive);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const { wallets } = useWallets();

    const [externalChain, setExternalChain] = useState<EVMChainOption>(
      () =>
        SOURCE_CHAIN_OPTIONS.find((o) => !DISABLED_SOURCE_CHAIN_IDS.has(o.chainId)) ??
        SOURCE_CHAIN_OPTIONS[0]
    );
    const [direction, setDirection] = useState<BridgeDirection>('in');
    const [amount, setAmount] = useState('0.001');

    const accountReady = Boolean(selectedAddress && selectedAddress !== DEAD_ADDRESS);
    const parsedAmount = (() => {
      try {
        return parseEther(amount);
      } catch {
        return null;
      }
    })();
    const injectedWallet =
      wallets.find(
        (wallet) =>
          wallet.connectorType === 'injected' &&
          wallet.address.toLowerCase() === selectedAddress.toLowerCase()
      ) ?? getInjectedWallet(wallets);

    /////////////////
    // ORCHESTRATION

    const {
      updates,
      externalBalance,
      yomiBalance,
      isBridging,
      hasSufficientSourceBalance,
      startBridge,
      handleBridgeModalClose,
    } = useBridgeOrchestration({
      selectedAddress,
      accountReady,
      injectedWallet,
      externalChain,
      direction,
      parsedAmount,
      isOpen,
      setBridgeProcessActive,
      setExternalChain,
    });

    /////////////////
    // SUBSCRIPTIONS

    useEffect(() => {
      const handleOpen = (event: Event) => {
        if (!(event instanceof CustomEvent) || !isBridgeOpenDetail(event.detail)) return;

        const details = event.detail;
        const routeRequest = details?.routeRequest;
        if (routeRequest) {
          const requestedChain = SOURCE_CHAIN_OPTIONS.find(
            (option) => option.chainId === routeRequest.source_asset_chain_id
          );
          if (requestedChain && !DISABLED_SOURCE_CHAIN_IDS.has(requestedChain.chainId)) {
            setExternalChain(requestedChain);
          }
          if (routeRequest.amount_in) {
            try {
              setAmount(formatEther(BigInt(routeRequest.amount_in)));
            } catch {
              // ignore malformed prefills
            }
          }
        }
      };

      window.addEventListener(BRIDGE_OPEN_REQUEST_EVENT, handleOpen);
      return () => window.removeEventListener(BRIDGE_OPEN_REQUEST_EVENT, handleOpen);
    }, []);

    /////////////////
    // INTERACTION

    const handleSwapDirection = () => {
      setDirection((prev) => (prev === 'in' ? 'out' : 'in'));
    };

    /////////////////
    // RENDERING

    return (
      <BridgeOverlay>
        <ModalWrapper
          id='bridge'
          header={<ModalHeader title='Bridge ETH' icon={MenuIcons.kami} />}
          canExit
          onClose={handleBridgeModalClose}
          noScroll
          truncate
        >
          <Content>
            <BridgeForm
              state={{ externalChain, direction, amount, parsedAmount, externalBalance, yomiBalance }}
              status={{ isBridging, accountReady, hasSufficientSourceBalance }}
              actions={{
                onAmountChange: setAmount,
                onSourceChainChange: setExternalChain,
                onSwapDirection: handleSwapDirection,
                onSubmit: startBridge,
              }}
            />
            <BridgeUpdates updates={updates} isOpen={isOpen} />
          </Content>
        </ModalWrapper>
      </BridgeOverlay>
    );
  },
};

const BridgeOverlay = styled.div`
  position: relative;
  z-index: 1000;
  height: 100%;
`;

const Content = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.8vw;

  min-height: 0;
  padding: 0.3vw;
  overflow: hidden;
`;
