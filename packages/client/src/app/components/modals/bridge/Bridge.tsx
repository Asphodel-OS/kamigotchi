import { useWallets } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { formatEther, parseEther } from 'viem';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useNetwork, useVisibility } from 'app/stores';
import { getEvmWalletProvider, getInjectedWallet } from 'app/utils';
import { MenuIcons } from 'assets/images/icons/menu';
import { DefaultChain } from 'constants/chains';
import {
  BRIDGE_OPEN_REQUEST_EVENT,
  BridgeEvmTx,
  buildBridgeRouteRequest,
  fetchBridgeMsgs,
  fetchBridgeRoute,
  getBridgeServiceStatus,
  isBridgeOpenDetail,
} from 'network/bridge';
import {
  DEAD_ADDRESS,
  DISABLED_SOURCE_CHAIN_IDS,
  DEGRADED_POLL_INTERVAL_MS,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  SOURCE_CHAIN_OPTIONS,
  STATUS_RECHECK_EVERY_ATTEMPTS,
  YOMINET_RPC_URL,
} from './constants';
import { BridgeForm } from './BridgeForm';
import { BridgeUpdates } from './BridgeUpdates';
import { createBridgeAbortError, isBridgeAbortError, waitForWalletChain } from './flow';
import { BridgeUpdateEntry, BridgeUpdateTone, EVMChainOption, EVMWalletProvider } from './types';
import {
  getNativeBalance,
  getSourceTransactionStatus,
  getYominetEthBalance,
  toHexQuantity,
} from './utils';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getDefaultSourceChain = () =>
  SOURCE_CHAIN_OPTIONS.find((option) => !DISABLED_SOURCE_CHAIN_IDS.has(option.chainId)) ??
  SOURCE_CHAIN_OPTIONS[0];

export const BridgeModal: UIComponent = {
  id: 'BridgeModal',
  Render: () => {
    /////////////////
    // PREPARATION

    const isOpen = useVisibility((s) => s.modals.bridge);
    const setBridgeProcessActive = useVisibility((s) => s.setBridgeProcessActive);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const { wallets } = useWallets();

    /////////////////
    // INSTANTIATIONS

    const [sourceChain, setSourceChain] = useState<EVMChainOption>(getDefaultSourceChain());
    const [amount, setAmount] = useState('0.001');

    const [sourceBalance, setSourceBalance] = useState<bigint>(0n);
    const [yomiBalance, setYomiBalance] = useState<bigint>(0n);
    const isRefreshingBalancesRef = useRef(false);

    const [isBridging, setIsBridging] = useState(false);
    const [updates, setUpdates] = useState<BridgeUpdateEntry[]>([]);
    const [shouldResetOnNextOpen, setShouldResetOnNextOpen] = useState(false);
    const messagesBodyRef = useRef<HTMLDivElement>(null);
    const isUserScrollingMessagesRef = useRef(false);
    const wasOpenRef = useRef(false);
    const abortBridgeRef = useRef(false);
    const previousWalletChainIdRef = useRef<string | null>(null);
    const hasOpenedWalletPromptRef = useRef(false);
    const closedDuringWalletPromptRef = useRef(false);

    /////////////////
    // INTERPRETATION

    const accountReady = Boolean(selectedAddress && selectedAddress !== DEAD_ADDRESS);
    const parsedAmount = (() => {
      try {
        return parseEther(amount);
      } catch {
        return null;
      }
    })();
    const hasSufficientSourceBalance = parsedAmount ? sourceBalance >= parsedAmount : false;
    const hasSubmittedBridge = updates.some(
      (update) => update.tone === 'meta' && update.text.startsWith('Tx: ')
    );
    const injectedWallet =
      wallets.find(
        (wallet) =>
          wallet.connectorType === 'injected' &&
          wallet.address.toLowerCase() === selectedAddress.toLowerCase()
      ) ?? getInjectedWallet(wallets);

    /////////////////
    // ACTIONS

    const appendUpdate = (
      tone: BridgeUpdateTone,
      text: string,
      options: { allowDuplicate?: boolean } = {}
    ) => {
      setUpdates((current) => {
        if (
          !options.allowDuplicate &&
          current[current.length - 1]?.text === text &&
          current[current.length - 1]?.tone === tone
        ) {
          return current;
        }
        return [...current, { id: Date.now() + Math.random(), tone, text }];
      });
    };

    const resetBridgeUiState = () => {
      setUpdates([]);
      setShouldResetOnNextOpen(false);
      abortBridgeRef.current = false;
      previousWalletChainIdRef.current = null;
      hasOpenedWalletPromptRef.current = false;
      closedDuringWalletPromptRef.current = false;
    };

    const clearBridgeState = (bridging: boolean) => {
      resetBridgeUiState();
      setIsBridging(bridging);
      setBridgeProcessActive(bridging);
    };

    const finishBridgeProcess = () => {
      setBridgeProcessActive(false);
    };

    const releaseBridgeProcessWhenWalletSettles = (
      wallet: EVMWalletProvider,
      targetChainId: string
    ) => {
      void waitForWalletChain(wallet, targetChainId)
        .catch((error) => {
          console.warn('Failed to confirm wallet chain while releasing bridge process.', error);
        })
        .finally(() => {
          finishBridgeProcess();
        });
    };

    const failBridge = (message: string) => {
      appendUpdate('error', message);
      setIsBridging(false);
      setShouldResetOnNextOpen(true);
      finishBridgeProcess();
    };

    const restorePreviousWalletChain = async (wallet: EVMWalletProvider) => {
      if (!previousWalletChainIdRef.current) {
        return;
      }

      try {
        await wallet.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: previousWalletChainIdRef.current }],
        });
      } catch (error) {
        console.warn('Failed to restore wallet chain after bridge abort.', error);
      } finally {
        previousWalletChainIdRef.current = null;
      }
    };

    const throwIfBridgeAborted = async (wallet?: EVMWalletProvider) => {
      if (!abortBridgeRef.current) return;
      if (wallet) {
        await restorePreviousWalletChain(wallet);
      }
      throw createBridgeAbortError();
    };

    const refreshBalances = async (): Promise<{ src: bigint; yomi: bigint } | null> => {
      if (!accountReady) return null;
      if (isRefreshingBalancesRef.current) return null;
      isRefreshingBalancesRef.current = true;
      try {
        const [src, yomi] = await Promise.all([
          getNativeBalance(sourceChain.rpcUrl, selectedAddress),
          getYominetEthBalance(selectedAddress),
        ]);
        setSourceBalance(src);
        setYomiBalance(yomi);
        return { src, yomi };
      } catch {
        return null;
      } finally {
        isRefreshingBalancesRef.current = false;
      }
    };

    const validateBridgeStart = async (): Promise<EVMWalletProvider | undefined> => {
      if (!accountReady) {
        appendUpdate('error', 'Connect your wallet first.');
        return undefined;
      }

      if (!parsedAmount || parsedAmount <= 0n) {
        appendUpdate('error', 'Enter a valid bridge amount.');
        return undefined;
      }

      if (!YOMINET_RPC_URL) {
        appendUpdate('error', 'Missing Yominet RPC url configuration.');
        return undefined;
      }

      const wallet = await getEvmWalletProvider(injectedWallet);
      if (!wallet) {
        appendUpdate('error', 'No connected injected wallet found.');
      }

      return wallet;
    };

    const prepareBridge = async (amountInWei: string) => {
      appendUpdate('status', 'Checking balances...');
      const latestBalances = await refreshBalances();
      await throwIfBridgeAborted();
      if (!latestBalances) {
        failBridge('Failed to refresh balances. Please try again.');
        return null;
      }

      const serviceStatus = await getBridgeServiceStatus();
      await throwIfBridgeAborted();
      if (!serviceStatus.healthy) {
        failBridge(
          serviceStatus.detail
            ? `Bridge service is degraded: ${serviceStatus.detail}. Try again shortly.`
            : 'Bridge service is degraded. Try again shortly.'
        );
        return null;
      }

      if (!parsedAmount || latestBalances.src < parsedAmount) {
        failBridge('Insufficient source-chain balance for this bridge amount.');
        return null;
      }

      const routeRequest = buildBridgeRouteRequest({
        source_asset_denom: sourceChain.denom,
        source_asset_chain_id: sourceChain.chainId,
        amount_in: amountInWei,
      });

      appendUpdate('status', 'Preparing bridge route...');
      const route = await fetchBridgeRoute(routeRequest);
      await throwIfBridgeAborted();
      const requiredChainAddresses = route.required_chain_addresses ?? [];
      const amountOut = typeof route.amount_out === 'string' ? route.amount_out : amountInWei;
      const requiredAddressCount = Math.max(requiredChainAddresses.length, 2);
      const addressList = Array.from({ length: requiredAddressCount }, () => selectedAddress);

      appendUpdate('status', 'Preparing bridge transaction...');
      const msgs = await fetchBridgeMsgs({
        ...routeRequest,
        amount_out: amountOut,
        address_list: addressList,
        slippage_tolerance_percent: '1',
        operations: route.operations,
      });
      await throwIfBridgeAborted();

      const evmTx = msgs.txs?.find((tx) => tx.evm_tx)?.evm_tx;
      if (!evmTx) {
        throw new Error('Router did not return an EVM transaction payload.');
      }

      return { evmTx, latestBalances };
    };

    const submitBridgeTransaction = async (wallet: EVMWalletProvider, evmTx: BridgeEvmTx) => {
      const walletChainId = `0x${BigInt(sourceChain.chainId).toString(16)}`;
      const yominetChainId = `0x${BigInt(DefaultChain.id).toString(16)}`;
      const currentWalletChainId = await wallet.request({ method: 'eth_chainId' });
      previousWalletChainIdRef.current =
        typeof currentWalletChainId === 'string' && currentWalletChainId !== walletChainId
          ? currentWalletChainId
          : null;

      await throwIfBridgeAborted(wallet);
      appendUpdate('status', 'Switching wallet to source chain...');
      await wallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: walletChainId }],
      });

      await throwIfBridgeAborted(wallet);
      await wallet.request({ method: 'eth_requestAccounts' });
      await throwIfBridgeAborted(wallet);
      appendUpdate('approval', 'Waiting for approval...');
      hasOpenedWalletPromptRef.current = true;
      let hash: unknown;
      try {
        hash = await wallet.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: selectedAddress,
              to: evmTx.to,
              value: toHexQuantity(BigInt(evmTx.value)),
              data: evmTx.data.startsWith('0x') ? evmTx.data : `0x${evmTx.data}`,
            },
          ],
        });
      } catch (error) {
        const restoreTargetChainId = previousWalletChainIdRef.current ?? yominetChainId;
        await restorePreviousWalletChain(wallet);
        hasOpenedWalletPromptRef.current = false;
        const shouldAbortAfterRejection = closedDuringWalletPromptRef.current;
        closedDuringWalletPromptRef.current = false;
        releaseBridgeProcessWhenWalletSettles(wallet, restoreTargetChainId);
        if (shouldAbortAfterRejection) {
          resetBridgeUiState();
          throw createBridgeAbortError();
        }
        throw error;
      }

      if (typeof hash !== 'string') {
        finishBridgeProcess();
        throw new Error('Wallet did not return a transaction hash.');
      }
      appendUpdate('status', 'Sending bridge transaction...');
      if (walletChainId !== yominetChainId) {
        await wallet.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: yominetChainId }],
        });
      }
      hasOpenedWalletPromptRef.current = false;
      closedDuringWalletPromptRef.current = false;
      previousWalletChainIdRef.current = null;
      appendUpdate('meta', `Tx: ${hash}`);
      appendUpdate('status', 'This will take a moment! Come back in 5 minutes!');
      releaseBridgeProcessWhenWalletSettles(wallet, yominetChainId);
      return hash;
    };

    const waitForBridgeCompletion = async (baseline: bigint, sourceTxHash: string) => {
      let sourceTransactionStatus = await getSourceTransactionStatus(sourceChain.rpcUrl, sourceTxHash);

      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        let pollIntervalMs = POLL_INTERVAL_MS;
        if (attempt % STATUS_RECHECK_EVERY_ATTEMPTS === 0) {
          const pollServiceStatus = await getBridgeServiceStatus();
          if (!pollServiceStatus.healthy) {
            pollIntervalMs = DEGRADED_POLL_INTERVAL_MS;
            appendUpdate(
              'status',
              'Bridge submitted. Service is degraded right now, so this may take longer.'
            );
          }
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        sourceTransactionStatus = await getSourceTransactionStatus(sourceChain.rpcUrl, sourceTxHash);
        if (sourceTransactionStatus === 'reverted') {
          appendUpdate(
            'error',
            `Source transaction reverted on ${sourceChain.label}. The bridge transfer was not completed.`
          );
          return;
        }

        const nextBalance = await getYominetEthBalance(selectedAddress);
        setYomiBalance(nextBalance);
        if (nextBalance > baseline) {
          appendUpdate('success', 'Bridge Complete Congratulations');
          setIsBridging(false);
          return;
        }
      }

      if (sourceTransactionStatus === 'success') {
        appendUpdate(
          'error',
          `Source transaction confirmed on ${sourceChain.label}, but the bridge relay has not completed on Yominet yet. Please check again shortly.`
        );
        return;
      }

      appendUpdate(
        'error',
        `Source transaction is still pending on ${sourceChain.label}. Please check your wallet or explorer and try again shortly.`
      );
    };

    const scrollMessagesToBottom = (behavior: ScrollBehavior = 'smooth') => {
      if (!messagesBodyRef.current) return;
      messagesBodyRef.current.scrollTo({
        top: messagesBodyRef.current.scrollHeight,
        behavior,
      });
    };

    const handleMessagesScroll = () => {
      if (!messagesBodyRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = messagesBodyRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      isUserScrollingMessagesRef.current = !isAtBottom;
    };

    const handleBridgeModalClose = () => {
      if (!isOpen) return true;
      if (!isBridging) return true;
      if (hasOpenedWalletPromptRef.current) {
        closedDuringWalletPromptRef.current = true;
        appendUpdate(
          'meta',
          'Close requested. Waiting for wallet response before closing the bridge modal.'
        );
        return false;
      }
      if (hasSubmittedBridge) {
        return true;
      }
      abortBridgeRef.current = true;
      setIsBridging(false);
      setShouldResetOnNextOpen(true);
      finishBridgeProcess();
      return true;
    };

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
            setSourceChain(requestedChain);
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

    useEffect(() => {
      const justOpened = isOpen && !wasOpenRef.current;
      wasOpenRef.current = isOpen;

      if (!justOpened) return;
      isUserScrollingMessagesRef.current = false;
      requestAnimationFrame(() => scrollMessagesToBottom('auto'));
      if (shouldResetOnNextOpen) {
        clearBridgeState(false);
        return;
      }
    }, [isOpen, shouldResetOnNextOpen]);

    useEffect(() => {
      if (!isOpen) return;
      refreshBalances();
      const intervalId = window.setInterval(() => {
        refreshBalances();
      }, 5000);
      return () => window.clearInterval(intervalId);
    }, [isOpen, sourceChain.chainId, selectedAddress]);

    useEffect(() => {
      if (!messagesBodyRef.current || isUserScrollingMessagesRef.current) return;
      requestAnimationFrame(() => scrollMessagesToBottom('smooth'));
    }, [updates]);

    /////////////////
    // INTERACTION

    const startBridge = async () => {
      const wallet = await validateBridgeStart();
      if (!wallet) {
        return;
      }

      clearBridgeState(true);

      try {
        if (!parsedAmount) {
          return;
        }

        const preparedBridge = await prepareBridge(parsedAmount.toString());
        if (!preparedBridge) {
          return;
        }

        await throwIfBridgeAborted(wallet);
        const sourceTxHash = await submitBridgeTransaction(wallet, preparedBridge.evmTx);
        await waitForBridgeCompletion(preparedBridge.latestBalances.yomi, sourceTxHash);
      } catch (error) {
        if (!isBridgeAbortError(error)) {
          appendUpdate('error', getErrorMessage(error, 'Bridge failed'));
          if (!hasOpenedWalletPromptRef.current) {
            setShouldResetOnNextOpen(true);
          }
        }
      } finally {
        setIsBridging(false);
      }
    };

    /////////////////
    // RENDERING

    return (
      <ModalWrapper
        id='bridge'
        header={<ModalHeader title='Bridge ETH to Yominet' icon={MenuIcons.kami} />}
        canExit
        onClose={handleBridgeModalClose}
        overlay
        noScroll
        wrapperZIndex={1000}
        truncate
      >
        <Content>
          <BridgeForm
            sourceChain={sourceChain}
            amount={amount}
            sourceBalance={sourceBalance}
            yomiBalance={yomiBalance}
            isBridging={isBridging}
            accountReady={accountReady}
            hasSufficientSourceBalance={hasSufficientSourceBalance}
            onAmountChange={setAmount}
            onSourceChainChange={setSourceChain}
            onSubmit={startBridge}
          />
          <BridgeUpdates
            updates={updates}
            messagesBodyRef={messagesBodyRef}
            onScroll={handleMessagesScroll}
          />
        </Content>
      </ModalWrapper>
    );
  },
};
const Content = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.8vw;
  height: 21vw;

  min-height: 0;
  padding: 0.3vw;
  overflow: hidden;
`;
