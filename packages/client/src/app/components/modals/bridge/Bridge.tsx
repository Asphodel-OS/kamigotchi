import { useWallets } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { formatEther, parseEther } from 'viem';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useNetwork, useVisibility } from 'app/stores';
import { getEvmWalletProvider, getInjectedWallet } from 'app/utils';
import { MenuIcons } from 'assets/images/icons/menu';
import { DEAD_ADDRESS } from 'constants/addresses';
import { DefaultChain } from 'constants/chains';
import {
  BRIDGE_OPEN_REQUEST_EVENT,
  BridgeEvmTx,
  buildBridgeRouteRequest,
  fetchBridgeMsgs,
  fetchBridgeRoute,
  getBridgeServiceStatus,
  getNativeBalance,
  getSourceTransactionStatus,
  getYominetBlockNumber,
  getYominetEthBalance,
  hasReceivedYominetEthMintSince,
  isBridgeOpenDetail,
} from './helpers/api';
import { BridgeForm } from './BridgeForm';
import { BridgeUpdates } from './BridgeUpdates';
import {
  BridgePhase,
  BridgeUpdateEntry,
  BridgeUpdateTone,
  DEGRADED_POLL_INTERVAL_MS,
  DISABLED_SOURCE_CHAIN_IDS,
  MIN_BRIDGE_AMOUNT,
  EVMChainOption,
  EVMWalletProvider,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  SOURCE_CHAIN_OPTIONS,
  STATUS_RECHECK_EVERY_ATTEMPTS,
} from './helpers/constants';
import { clearBridgePolling, loadBridgePolling, saveBridgePolling } from './helpers/persistence';
import {
  createBridgeAbortError,
  isBridgeAbortError,
  toHexQuantity,
  waitForWalletChain,
} from './helpers/utils';

export const BridgeModal: UIComponent = {
  id: 'BridgeModal',
  Render: () => {
    /////////////////
    // PREPARATION

    const isOpen = useVisibility((s) => s.modals.bridge);
    const setBridgeProcessActive = useVisibility((s) => s.setBridgeProcessActive);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const { wallets } = useWallets();

    const [sourceChain, setSourceChain] = useState<EVMChainOption>(
      () =>
        SOURCE_CHAIN_OPTIONS.find((o) => !DISABLED_SOURCE_CHAIN_IDS.has(o.chainId)) ??
        SOURCE_CHAIN_OPTIONS[0]
    );
    const [amount, setAmount] = useState('0.001');

    const [sourceBalance, setSourceBalance] = useState<bigint>(0n);
    const [yomiBalance, setYomiBalance] = useState<bigint>(0n);
    const isRefreshingBalancesRef = useRef(false);

    const [phase, setPhase] = useState<BridgePhase>('idle');
    const [updates, _setUpdates] = useState<BridgeUpdateEntry[]>([]);
    const updatesRef = useRef<BridgeUpdateEntry[]>([]);
    const [shouldResetOnNextOpen, setShouldResetOnNextOpen] = useState(false);
    const phaseRef = useRef<BridgePhase>('idle');
    const previousWalletChainIdRef = useRef<string | null>(null);
    const closedDuringWalletPromptRef = useRef(false);
    const bridgeAbortRef = useRef<AbortController>(new AbortController());

    const setUpdates = (value: BridgeUpdateEntry[] | ((prev: BridgeUpdateEntry[]) => BridgeUpdateEntry[])) => {
      const next = typeof value === 'function' ? value(updatesRef.current) : value;
      updatesRef.current = next;
      _setUpdates(next);
    };

    const accountReady = Boolean(selectedAddress && selectedAddress !== DEAD_ADDRESS);
    const parsedAmount = (() => {
      try {
        return parseEther(amount);
      } catch {
        return null;
      }
    })();
    const hasSufficientSourceBalance = parsedAmount ? sourceBalance >= parsedAmount : false;
    const isBridging = phase !== 'idle';
    const injectedWallet =
      wallets.find(
        (wallet) =>
          wallet.connectorType === 'injected' &&
          wallet.address.toLowerCase() === selectedAddress.toLowerCase()
      ) ?? getInjectedWallet(wallets);

    /////////////////
    // ACTIONS

    const appendUpdate = (tone: BridgeUpdateTone, text: string, url?: string) => {
      setUpdates((current) => {
        const last = current[current.length - 1];
        if (last?.text === text && last?.tone === tone) return current;
        return [...current, { id: Date.now() + Math.random(), tone, text, url }];
      });
    };

    const setBridgePhase = (nextPhase: BridgePhase) => {
      phaseRef.current = nextPhase;
      setPhase(nextPhase);
    };

    const resetBridgeUiState = () => {
      setUpdates([]);
      setShouldResetOnNextOpen(false);
      setBridgePhase('idle');
      previousWalletChainIdRef.current = null;
      closedDuringWalletPromptRef.current = false;
      clearBridgePolling();
    };

    const clearBridgeState = (bridging: boolean) => {
      bridgeAbortRef.current.abort();
      bridgeAbortRef.current = new AbortController();
      resetBridgeUiState();
      setBridgePhase(bridging ? 'preparing' : 'idle');
      setBridgeProcessActive(bridging);
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
          setBridgeProcessActive(false);
        });
    };

    const failBridge = (message: string) => {
      appendUpdate('error', message);
      setBridgePhase('idle');
      setShouldResetOnNextOpen(true);
      setBridgeProcessActive(false);
    };

    const restorePreviousWalletChain = async (wallet: EVMWalletProvider) => {
      if (!previousWalletChainIdRef.current) return;
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
      if (phaseRef.current !== 'aborted') return;
      if (wallet) {
        await restorePreviousWalletChain(wallet);
      }
      setBridgePhase('idle');
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

      if (!parsedAmount || parsedAmount < MIN_BRIDGE_AMOUNT) {
        appendUpdate('error', 'Minimum bridge amount is 0.000001 ETH.');
        return undefined;
      }

      const wallet = await getEvmWalletProvider(injectedWallet);
      if (!wallet) {
        appendUpdate('error', 'No connected injected wallet found.');
      }

      return wallet;
    };

    const prepareBridge = async (amountInWei: string, signal: AbortSignal) => {
      appendUpdate('status', 'Checking balances...');
      const latestBalances = await refreshBalances();
      if (signal.aborted) throw createBridgeAbortError();
      if (!latestBalances) {
        failBridge('Failed to refresh balances. Please try again.');
        return null;
      }

      const serviceStatus = await getBridgeServiceStatus();
      if (signal.aborted) throw createBridgeAbortError();
      if (!serviceStatus.healthy) {
        failBridge(
          serviceStatus.detail
            ? `Bridge service is degraded: ${serviceStatus.detail}. Try again shortly.`
            : 'Bridge service is degraded. Try again shortly.'
        );
        return null;
      }

      if (!parsedAmount || latestBalances.src < parsedAmount) {
        failBridge(`Insufficient **${sourceChain.label}** balance for this bridge amount.`);
        return null;
      }

      const routeRequest = buildBridgeRouteRequest({
        source_asset_denom: sourceChain.denom,
        source_asset_chain_id: sourceChain.chainId,
        amount_in: amountInWei,
      });

      appendUpdate('status', `Preparing route:\n**${sourceChain.label}** → **Yominet**...`);
      const route = await fetchBridgeRoute(routeRequest);
      if (signal.aborted) throw createBridgeAbortError();
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
      if (signal.aborted) throw createBridgeAbortError();

      const evmTx = msgs.txs?.find((tx) => tx.evm_tx)?.evm_tx;
      if (!evmTx) {
        throw new Error('Router did not return an EVM transaction payload.');
      }

      return { evmTx, expectedAmountOut: amountOut };
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
      setBridgePhase('switchingWallet');
      appendUpdate('status', `Switching wallet to **${sourceChain.label}**...`);
      await wallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: walletChainId }],
      });

      await throwIfBridgeAborted(wallet);
      await wallet.request({ method: 'eth_requestAccounts' });
      await throwIfBridgeAborted(wallet);
      setBridgePhase('awaitingApproval');
      appendUpdate('approval', 'Waiting for approval...');
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
        const shouldAbortAfterRejection = closedDuringWalletPromptRef.current;
        closedDuringWalletPromptRef.current = false;
        releaseBridgeProcessWhenWalletSettles(wallet, restoreTargetChainId);
        if (shouldAbortAfterRejection) {
          resetBridgeUiState();
          throw createBridgeAbortError();
        }
        setBridgePhase('idle');
        throw error;
      }

      if (typeof hash !== 'string') {
        setBridgePhase('idle');
        setBridgeProcessActive(false);
        throw new Error('Wallet did not return a transaction hash.');
      }
      setBridgePhase('submitted');
      appendUpdate('status', 'Sending bridge transaction...');
      if (walletChainId !== yominetChainId) {
        await wallet.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: yominetChainId }],
        });
      }
      closedDuringWalletPromptRef.current = false;
      previousWalletChainIdRef.current = null;
      appendUpdate('status', `**${sourceChain.label}** Tx: ${hash}`, `${sourceChain.explorerUrl}/tx/${hash}`);
      appendUpdate('status', `Bridging:\n**${sourceChain.label}** → **Yominet**\nCome back in 5 minutes!`);
      releaseBridgeProcessWhenWalletSettles(wallet, yominetChainId);
      return hash;
    };

    const persistCompletion = () => {
      const persisted = loadBridgePolling();
      if (persisted) saveBridgePolling({ ...persisted, updates: updatesRef.current, completed: true });
    };

    const waitForBridgeCompletion = async (
      pollingSourceChain: EVMChainOption,
      yominetStartBlock: number,
      expectedAmountOut: bigint,
      sourceTxHash: string,
      signal: AbortSignal
    ) => {
      let sourceTransactionStatus = await getSourceTransactionStatus(
        pollingSourceChain.rpcUrl,
        sourceTxHash
      );

      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        if (signal.aborted) return;
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
        if (signal.aborted) return;
        sourceTransactionStatus = await getSourceTransactionStatus(
          pollingSourceChain.rpcUrl,
          sourceTxHash
        );
        if (sourceTransactionStatus === 'reverted') {
          appendUpdate(
            'error',
            `Source transaction reverted on ${pollingSourceChain.label}. The bridge transfer was not completed.`
          );
          persistCompletion();
          return;
        }

        const receivedOnYominet = await hasReceivedYominetEthMintSince(
          selectedAddress,
          yominetStartBlock,
          expectedAmountOut
        );
        const nextBalance = await getYominetEthBalance(selectedAddress);
        setYomiBalance(nextBalance);
        if (receivedOnYominet) {
          appendUpdate('success', `**Yominet** Tx: ${receivedOnYominet}`, `${DefaultChain.blockExplorers?.default.url}/tx/${receivedOnYominet}`);
          appendUpdate('celebrate', 'Bridge Complete Congratulations');
          persistCompletion();
          return;
        }
      }

      if (sourceTransactionStatus === 'success') {
        appendUpdate(
          'error',
          `Source transaction confirmed on ${pollingSourceChain.label}, but no matching Yominet transfer has been observed yet. Please check again shortly.`
        );
        persistCompletion();
        return;
      }

      appendUpdate(
        'error',
        `Source transaction is still pending on ${pollingSourceChain.label}. Please check your wallet or explorer and try again shortly.`
      );
      persistCompletion();
    };

    const handleBridgeModalClose = () => {
      if (!isOpen || phaseRef.current === 'idle') return true;
      if (phaseRef.current === 'awaitingApproval') {
        closedDuringWalletPromptRef.current = true;
        appendUpdate(
          'meta',
          'Close requested. Waiting for wallet response before closing the bridge modal.'
        );
        return false;
      }
      if (phaseRef.current === 'submitted') {
        return true;
      }
      bridgeAbortRef.current.abort();
      setBridgePhase('aborted');
      setShouldResetOnNextOpen(true);
      setBridgeProcessActive(false);
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
      if (!accountReady) return;
      const persisted = loadBridgePolling();
      if (!persisted || persisted.selectedAddress !== selectedAddress) return;

      const chain = SOURCE_CHAIN_OPTIONS.find((o) => o.chainId === persisted.sourceChainId);
      if (!chain) {
        clearBridgePolling();
        return;
      }

      setSourceChain(chain);
      setUpdates(persisted.updates);

      if (persisted.completed) return;
      if (
        typeof persisted.expectedAmountOut !== 'string' ||
        typeof persisted.yominetStartBlock !== 'number'
      ) {
        clearBridgePolling();
        return;
      }

      setBridgePhase('submitted');
      waitForBridgeCompletion(
        chain,
        persisted.yominetStartBlock,
        BigInt(persisted.expectedAmountOut),
        persisted.sourceTxHash,
        bridgeAbortRef.current.signal
      ).finally(() => {
        setBridgePhase('idle');
      });
    }, [selectedAddress]);

    useEffect(() => {
      if (isOpen && shouldResetOnNextOpen) {
        clearBridgeState(false);
      }
    }, [isOpen, shouldResetOnNextOpen]);

    useEffect(() => {
      if (!isOpen) return;
      refreshBalances();
      const intervalId = window.setInterval(refreshBalances, 5000);
      return () => window.clearInterval(intervalId);
    }, [isOpen, sourceChain.chainId, selectedAddress]);

    /////////////////
    // INTERACTION

    const startBridge = async () => {
      const wallet = await validateBridgeStart();
      if (!wallet) return;

      clearBridgeState(true);
      const signal = bridgeAbortRef.current.signal;

      try {
        if (!parsedAmount) return;

        const preparedBridge = await prepareBridge(parsedAmount.toString(), signal);
        if (signal.aborted) throw createBridgeAbortError();
        if (!preparedBridge) return;

        const yominetStartBlock = await getYominetBlockNumber();
        if (signal.aborted) throw createBridgeAbortError();
        const sourceTxHash = await submitBridgeTransaction(wallet, preparedBridge.evmTx);
        if (signal.aborted) throw createBridgeAbortError();
        saveBridgePolling({
          sourceTxHash,
          expectedAmountOut: preparedBridge.expectedAmountOut,
          sourceChainId: sourceChain.chainId,
          yominetStartBlock,
          selectedAddress,
          updates: updatesRef.current,
          timestamp: Date.now(),
          completed: false,
        });
        await waitForBridgeCompletion(
          sourceChain,
          yominetStartBlock,
          BigInt(preparedBridge.expectedAmountOut),
          sourceTxHash,
          signal
        );
      } catch (error) {
        if (signal.aborted) return;
        if (!isBridgeAbortError(error)) {
          appendUpdate('error', error instanceof Error ? error.message : 'Bridge failed');
          if (phaseRef.current !== 'submitted') {
            setShouldResetOnNextOpen(true);
          }
        }
      } finally {
        if (!signal.aborted) {
          if (phaseRef.current !== 'aborted') {
            setBridgePhase('idle');
          }
        }
      }
    };

    /////////////////
    // RENDERING

    return (
      <BridgeOverlay>
        <ModalWrapper
          id='bridge'
          header={<ModalHeader title='Bridge ETH to Yominet' icon={MenuIcons.kami} />}
          canExit
          onClose={handleBridgeModalClose}
          noScroll
          truncate
        >
          <Content>
            <BridgeForm
              sourceChain={sourceChain}
              amount={amount}
              parsedAmount={parsedAmount}
              sourceBalance={sourceBalance}
              yomiBalance={yomiBalance}
              isBridging={isBridging}
              accountReady={accountReady}
              hasSufficientSourceBalance={hasSufficientSourceBalance}
              onAmountChange={setAmount}
              onSourceChainChange={setSourceChain}
              onSubmit={startBridge}
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
  height: 21vw;

  min-height: 0;
  padding: 0.3vw;
  overflow: hidden;
`;
