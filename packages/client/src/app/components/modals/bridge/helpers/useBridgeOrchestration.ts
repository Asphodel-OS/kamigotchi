import { useEffect, useRef, useState } from 'react';

import { getEvmWalletProvider } from 'app/utils';
import { DefaultChain } from 'constants/chains';
import {
  BridgeCosmosTx,
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
} from './api';
import {
  BridgeDirection,
  BridgePhase,
  BridgeUpdateEntry,
  BridgeUpdateTone,
  DEGRADED_POLL_INTERVAL_MS,
  EVMChainOption,
  EVMWalletProvider,
  MIN_BRIDGE_AMOUNT,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  SOURCE_CHAIN_OPTIONS,
  STATUS_RECHECK_EVERY_ATTEMPTS,
  YOMINET_CHAIN_OPTION,
} from './constants';
import { clearBridgePolling, loadBridgePolling, saveBridgePolling } from './persistence';
import {
  createBridgeAbortError,
  isBridgeAbortError,
  toHexQuantity,
  waitForWalletChain,
} from './utils';

type UseBridgeOrchestrationParams = {
  selectedAddress: string;
  accountReady: boolean;
  injectedWallet?: Pick<import('@privy-io/react-auth').ConnectedWallet, 'getEthereumProvider'>;
  externalChain: EVMChainOption;
  direction: BridgeDirection;
  parsedAmount: bigint | null;
  isOpen: boolean;
  setBridgeProcessActive: (active: boolean) => void;
  setExternalChain: (chain: EVMChainOption) => void;
};

type UseBridgeOrchestrationReturn = {
  updates: BridgeUpdateEntry[];
  externalBalance: bigint;
  yomiBalance: bigint;
  isBridging: boolean;
  hasSufficientSourceBalance: boolean;
  startBridge: () => Promise<void>;
  handleBridgeModalClose: () => boolean;
};

export const useBridgeOrchestration = ({
  selectedAddress,
  accountReady,
  injectedWallet,
  externalChain,
  direction,
  parsedAmount,
  isOpen,
  setBridgeProcessActive,
  setExternalChain,
}: UseBridgeOrchestrationParams): UseBridgeOrchestrationReturn => {
  const sourceChain = direction === 'in' ? externalChain : YOMINET_CHAIN_OPTION;
  const destinationChain = direction === 'in' ? YOMINET_CHAIN_OPTION : externalChain;

  /////////////////
  // STATE

  const [externalBalance, setExternalBalance] = useState<bigint>(0n);
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

  const setUpdates = (
    value: BridgeUpdateEntry[] | ((prev: BridgeUpdateEntry[]) => BridgeUpdateEntry[])
  ) => {
    const next = typeof value === 'function' ? value(updatesRef.current) : value;
    updatesRef.current = next;
    _setUpdates(next);
  };

  const sourceBalance = direction === 'in' ? externalBalance : yomiBalance;
  const hasSufficientSourceBalance = parsedAmount ? sourceBalance >= parsedAmount : false;
  const isBridging = phase !== 'idle';

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
      const [externalBal, yomi] = await Promise.all([
        getNativeBalance(externalChain.rpcUrl, selectedAddress),
        getYominetEthBalance(selectedAddress),
      ]);
      setExternalBalance(externalBal);
      setYomiBalance(yomi);
      const src = direction === 'in' ? externalBal : yomi;
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
      dest_asset_denom: destinationChain.denom,
      dest_asset_chain_id: destinationChain.chainId,
      amount_in: amountInWei,
    });

    appendUpdate(
      'status',
      `Preparing route:\n**${sourceChain.label}** → **${destinationChain.label}**...`
    );
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
    const cosmosTx = msgs.txs?.find((tx) => tx.cosmos_tx)?.cosmos_tx;
    if (!evmTx && !cosmosTx) {
      throw new Error('Router did not return a transaction payload.');
    }

    if (cosmosTx) {
      return { cosmosTx, expectedAmountOut: amountOut };
    }

    return { evmTx: evmTx as BridgeEvmTx, expectedAmountOut: amountOut };
  };

  const submitBridgeTransaction = async (wallet: EVMWalletProvider, evmTx: BridgeEvmTx) => {
    const yominetChainId = `0x${BigInt(DefaultChain.id).toString(16)}`;
    const walletChainId =
      direction === 'out' ? yominetChainId : `0x${BigInt(sourceChain.chainId).toString(16)}`;
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
    appendUpdate(
      'status',
      `**${sourceChain.label}** Tx: ${hash}`,
      `${sourceChain.explorerUrl}/tx/${hash}`
    );
    appendUpdate(
      'status',
      `Bridging:\n**${sourceChain.label}** → **${destinationChain.label}**\nCome back in 5 minutes!`
    );
    releaseBridgeProcessWhenWalletSettles(wallet, yominetChainId);
    return hash;
  };

  const submitCosmosBridgeTransaction = async (
    wallet: EVMWalletProvider,
    cosmosTx: BridgeCosmosTx
  ) => {
    const yominetChainId = `0x${BigInt(DefaultChain.id).toString(16)}`;
    const currentWalletChainId = await wallet.request({ method: 'eth_chainId' });
    previousWalletChainIdRef.current =
      typeof currentWalletChainId === 'string' && currentWalletChainId !== yominetChainId
        ? currentWalletChainId
        : null;

    await throwIfBridgeAborted(wallet);
    setBridgePhase('switchingWallet');
    appendUpdate('status', `Switching wallet to **${sourceChain.label}**...`);
    await wallet.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: yominetChainId }],
    });

    await throwIfBridgeAborted(wallet);
    await wallet.request({ method: 'eth_requestAccounts' });
    await throwIfBridgeAborted(wallet);
    setBridgePhase('awaitingApproval');
    appendUpdate('approval', 'Waiting for approval...');

    let lastHash: string | undefined;
    try {
      for (const m of cosmosTx.msgs) {
        const parsed = JSON.parse(m.msg) as {
          contract_addr: string;
          input: string;
          value: string;
        };
        const hash = await wallet.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: selectedAddress,
              to: parsed.contract_addr,
              value: toHexQuantity(BigInt(parsed.value)),
              data: parsed.input.startsWith('0x') ? parsed.input : `0x${parsed.input}`,
            },
          ],
        });
        if (typeof hash !== 'string') {
          throw new Error('Wallet did not return a transaction hash.');
        }
        lastHash = hash;
      }
    } catch (error) {
      await restorePreviousWalletChain(wallet);
      const shouldAbortAfterRejection = closedDuringWalletPromptRef.current;
      closedDuringWalletPromptRef.current = false;
      releaseBridgeProcessWhenWalletSettles(wallet, yominetChainId);
      if (shouldAbortAfterRejection) {
        resetBridgeUiState();
        throw createBridgeAbortError();
      }
      setBridgePhase('idle');
      throw error;
    }

    if (!lastHash) throw new Error('No transactions to submit.');

    setBridgePhase('submitted');
    closedDuringWalletPromptRef.current = false;
    previousWalletChainIdRef.current = null;
    appendUpdate('status', 'Sending bridge transaction...');
    appendUpdate(
      'status',
      `**Yominet** Tx: ${lastHash}`,
      `${YOMINET_CHAIN_OPTION.explorerUrl}/tx/${lastHash}`
    );
    appendUpdate(
      'status',
      `Bridging:\n**${sourceChain.label}** → **${destinationChain.label}**\nCome back in 5 minutes!`
    );
    releaseBridgeProcessWhenWalletSettles(wallet, yominetChainId);
    return lastHash;
  };

  const persistCompletion = () => {
    const persisted = loadBridgePolling();
    if (persisted)
      saveBridgePolling({ ...persisted, updates: updatesRef.current, completed: true });
  };

  const waitForBridgeCompletion = async (
    pollingSourceChain: EVMChainOption,
    yominetStartBlock: number,
    expectedAmountOut: bigint,
    sourceTxHash: string,
    signal: AbortSignal
  ) => {
    const canPollSource = Boolean(pollingSourceChain.rpcUrl);
    let sourceTransactionStatus: import('./api').SourceTransactionStatus = canPollSource
      ? await getSourceTransactionStatus(pollingSourceChain.rpcUrl, sourceTxHash)
      : 'success';

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

      if (canPollSource) {
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
      }

      const receivedOnYominet = await hasReceivedYominetEthMintSince(
        selectedAddress,
        yominetStartBlock,
        expectedAmountOut
      );
      const nextBalance = await getYominetEthBalance(selectedAddress);
      setYomiBalance(nextBalance);
      if (receivedOnYominet) {
        appendUpdate(
          'success',
          `**Yominet** Tx: ${receivedOnYominet}`,
          `${DefaultChain.blockExplorers?.default.url}/tx/${receivedOnYominet}`
        );
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

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!accountReady) return;
    const persisted = loadBridgePolling();
    if (!persisted || persisted.selectedAddress !== selectedAddress) return;

    const chain = SOURCE_CHAIN_OPTIONS.find((o) => o.chainId === persisted.sourceChainId);
    if (!chain) {
      clearBridgePolling();
      return;
    }

    setExternalChain(chain);
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
  }, [isOpen, externalChain.chainId, direction, selectedAddress]);

  /////////////////
  // INTERACTION

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

      let sourceTxHash: string;
      if ('cosmosTx' in preparedBridge) {
        sourceTxHash = await submitCosmosBridgeTransaction(
          wallet,
          preparedBridge.cosmosTx as BridgeCosmosTx
        );
      } else {
        sourceTxHash = await submitBridgeTransaction(wallet, preparedBridge.evmTx as BridgeEvmTx);
      }
      if (signal.aborted) throw createBridgeAbortError();

      saveBridgePolling({
        sourceTxHash,
        expectedAmountOut: preparedBridge.expectedAmountOut,
        sourceChainId: externalChain.chainId,
        yominetStartBlock,
        selectedAddress,
        updates: updatesRef.current,
        timestamp: Date.now(),
        completed: false,
      });

      // For bridge-out (cosmosTx), source is Yominet — use its RPC URL for polling.
      const pollingChain = 'cosmosTx' in preparedBridge
        ? { ...YOMINET_CHAIN_OPTION, rpcUrl: DefaultChain.rpcUrls.default.http[0] ?? '' }
        : sourceChain;
      await waitForBridgeCompletion(
        pollingChain,
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

  return {
    updates,
    externalBalance,
    yomiBalance,
    isBridging,
    hasSufficientSourceBalance,
    startBridge,
    handleBridgeModalClose,
  };
};
