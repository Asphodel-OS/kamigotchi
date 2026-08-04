import { useWallets } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { formatEther, parseEther, type Abi } from 'viem';
import { useReadContract } from 'wagmi';

import NewbieVendorBuySystem from 'abi/NewbieVendorBuySystem.json';
import { useLayers } from 'app/root/hooks';
import { getSystemAddr } from 'network/shapes/utils';
import { parseBigIntSafe } from 'utils/numbers';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { getEvmWalletProvider, getInjectedWallet } from 'app/utils';
import { MenuIcons } from 'assets/images/icons/menu';
import { DEAD_ADDRESS } from 'constants/addresses';
import { DefaultChain } from 'constants/chains';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { BridgeForm } from './BridgeForm';
import { BridgeUpdates } from './BridgeUpdates';
import {
  BRIDGE_OPEN_REQUEST_EVENT,
  BridgeEvmTx,
  buildBridgeRouteRequest,
  encodeErc20Approve,
  fetchBridgeMsgs,
  fetchBridgeRoute,
  fetchRoutableSourceOptionIds,
  getBridgeServiceStatus,
  getBridgeTransferState,
  getErc20Allowance,
  getErc20Balance,
  getNativeBalance,
  getSourceTransactionStatus,
  getYominetTokenBalance,
  isBridgeOpenDetail,
  trackBridgeTransaction,
  waitForSourceTransaction,
} from './helpers/api';
import {
  BridgeAssetId,
  BridgePhase,
  BridgeUpdateEntry,
  BridgeUpdateTone,
  DEFAULT_BRIDGE_ASSET,
  DEGRADED_POLL_INTERVAL_MS,
  DISABLED_SOURCE_CHAIN_IDS,
  EVMChainOption,
  EVMWalletProvider,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  SOURCE_CHAIN_OPTIONS,
  STATUS_RECHECK_EVERY_ATTEMPTS,
  getDefaultChainForAsset,
  getDestDenom,
  getMinBridgeAmountLabel,
} from './helpers/constants';
import {
  PersistedBridgePolling,
  clearBridgePolling,
  loadBridgePolling,
  saveBridgePolling,
} from './helpers/persistence';
import {
  createBridgeAbortError,
  isBridgeAbortError,
  toHexQuantity,
  waitForWalletChain,
} from './helpers/utils';

const NEWBIE_VENDOR_BUY_SYSTEM_ID = 'system.newbievendor.buy';
// headroom on top of Zevana's live price so the operator wallet can be funded
// for a first session (~300+ moves) — targets a ~0.01 total default
const PREFILL_OPERATOR_GAS_HEADROOM = 3_000_000_000_000_000n; // 0.003 ETH
const PREFILL_ROUNDING_STEP = 100_000_000_000_000n; // round default up to 0.0001
// how long the "Bridge Complete" celebration stays up before the modal
// auto-advances a new player to the registration screen
const AUTO_ADVANCE_DELAY_MS = 2500;

const getDefaultSourceChain = () => getDefaultChainForAsset(DEFAULT_BRIDGE_ASSET);

export const BridgeModal: UIComponent = {
  id: 'BridgeModal',
  Render: () => {
    /////////////////
    // PREPARATION

    const { network } = useLayers();
    const { world, components } = network;
    const isOpen = useVisibility((s) => s.modals.bridge);
    const setModals = useVisibility((s) => s.setModals);
    const setBridgeProcessActive = useVisibility((s) => s.setBridgeProcessActive);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const accountValidations = useAccount((s) => s.validations);
    const { wallets } = useWallets();

    const [sourceChain, setSourceChain] = useState<EVMChainOption>(getDefaultSourceChain);
    const [amount, setAmount] = useState(() => getDefaultSourceChain().defaultAmount);
    // tracks whether the amount came from the user (or an explicit route
    // prefill) — the Zevana-price default must never clobber those
    const amountTouchedRef = useRef(false);

    const [sourceBalance, setSourceBalance] = useState<bigint>(0n);
    const [yomiBalance, setYomiBalance] = useState<bigint>(0n);
    const isRefreshingBalancesRef = useRef(false);

    const [phase, setPhase] = useState<BridgePhase>('idle');
    const [updates, _setUpdates] = useState<BridgeUpdateEntry[]>([]);
    const updatesRef = useRef<BridgeUpdateEntry[]>([]);
    const [shouldResetOnNextOpen, setShouldResetOnNextOpen] = useState(false);
    // polling gave up but the bridge may still land — offers a manual re-check
    const [pollTimedOut, setPollTimedOut] = useState(false);
    // chains the router can actually route from right now (null = not probed
    // yet, treat as all-routable). initia de-lists sources server-side
    const [routableOptionIds, setRoutableOptionIds] = useState<Set<string> | null>(null);
    const phaseRef = useRef<BridgePhase>('idle');
    const previousWalletChainIdRef = useRef<string | null>(null);
    const closedDuringWalletPromptRef = useRef(false);
    const bridgeAbortRef = useRef<AbortController>(new AbortController());
    const autoAdvanceTimerRef = useRef<number | null>(null);

    const setUpdates = (
      value: BridgeUpdateEntry[] | ((prev: BridgeUpdateEntry[]) => BridgeUpdateEntry[])
    ) => {
      const next = typeof value === 'function' ? value(updatesRef.current) : value;
      updatesRef.current = next;
      _setUpdates(next);
    };

    const accountReady = Boolean(selectedAddress && selectedAddress !== DEAD_ADDRESS);
    const onyxLocked = accountValidations.accountChecked && !accountValidations.accountExists;
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

    const handleAssetChange = (asset: BridgeAssetId) => {
      if (asset === sourceChain.asset) return;
      const nextChain = getDefaultChainForAsset(asset, sourceChain.chainId);
      setSourceChain(nextChain);
      // each asset has its own default, and the eth prefill re-applies below
      amountTouchedRef.current = false;
      setAmount(nextChain.defaultAmount);
    };

    const setBridgePhase = (nextPhase: BridgePhase) => {
      phaseRef.current = nextPhase;
      setPhase(nextPhase);
    };

    const resetBridgeUiState = () => {
      setUpdates([]);
      setShouldResetOnNextOpen(false);
      setPollTimedOut(false);
      setBridgePhase('idle');
      previousWalletChainIdRef.current = null;
      closedDuringWalletPromptRef.current = false;
      clearBridgePolling();
    };

    const cancelAutoAdvance = () => {
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };

    const clearBridgeState = (bridging: boolean) => {
      cancelAutoAdvance();
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

    const refreshBalances = async (): Promise<{
      src: bigint;
      native: bigint;
      yomi: bigint;
    } | null> => {
      if (!accountReady) return null;
      if (isRefreshingBalancesRef.current) return null;
      isRefreshingBalancesRef.current = true;
      try {
        const sourceToken = sourceChain.sourceTokenAddress;
        const [native, yomi, srcToken] = await Promise.all([
          getNativeBalance(sourceChain.rpcUrl, selectedAddress),
          getYominetTokenBalance(sourceChain.destTokenAddress, selectedAddress),
          sourceToken
            ? getErc20Balance(sourceChain.rpcUrl, sourceToken, selectedAddress)
            : Promise.resolve(null),
        ]);
        const src = srcToken ?? native;
        setSourceBalance(src);
        setYomiBalance(yomi);
        return { src, native, yomi };
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

      if (!parsedAmount || parsedAmount < sourceChain.minAmount) {
        appendUpdate('error', `Minimum bridge amount is ${getMinBridgeAmountLabel(sourceChain)}.`);
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
        failBridge(
          `Insufficient **${sourceChain.symbol}** balance on **${sourceChain.label}** for this bridge amount.`
        );
        return null;
      }

      if (sourceChain.sourceTokenAddress && latestBalances.native === 0n) {
        failBridge(`No ETH on **${sourceChain.label}** to pay gas for this bridge.`);
        return null;
      }

      const routeRequest = buildBridgeRouteRequest({
        source_asset_denom: sourceChain.denom,
        source_asset_chain_id: sourceChain.chainId,
        dest_asset_denom: getDestDenom(sourceChain),
        amount_in: amountInWei,
      });

      appendUpdate('status', `Preparing route:\n**${sourceChain.label}** → **Yominet**...`);
      let route;
      try {
        route = await fetchBridgeRoute(routeRequest);
      } catch (error) {
        if (signal.aborted) throw createBridgeAbortError();
        if (error instanceof Error && error.message.includes('Route not found')) {
          failBridge(
            `No bridge route from **${sourceChain.label}** to Yominet right now — try Ethereum Mainnet.`
          );
          return null;
        }
        throw error;
      }
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

    const abortWalletFlow = async (
      wallet: EVMWalletProvider,
      yominetChainId: string,
      error: unknown
    ): Promise<never> => {
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
    };

    const ensureErc20Approvals = async (wallet: EVMWalletProvider, evmTx: BridgeEvmTx) => {
      const approvals = evmTx.required_erc20_approvals ?? [];
      const symbol = sourceChain.symbol;

      for (const approval of approvals) {
        const required = BigInt(approval.amount);
        const current = await getErc20Allowance(
          sourceChain.rpcUrl,
          approval.token_contract,
          selectedAddress,
          approval.spender
        );
        if (current >= required) continue;

        await throwIfBridgeAborted(wallet);
        setBridgePhase('approving');
        appendUpdate('approval', `Approve ${symbol} spending to continue...`);
        const approvalHash = await wallet.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: selectedAddress,
              to: approval.token_contract,
              data: encodeErc20Approve(approval.spender, required),
            },
          ],
        });

        if (typeof approvalHash !== 'string') {
          throw new Error('Wallet did not return an approval transaction hash.');
        }

        setBridgePhase('confirmingApproval');
        appendUpdate(
          'status',
          `Approval Tx: ${approvalHash}`,
          `${sourceChain.explorerUrl}/tx/${approvalHash}`
        );
        appendUpdate('status', `Waiting for ${symbol} approval to confirm...`);
        await waitForSourceTransaction(
          sourceChain.rpcUrl,
          approvalHash,
          bridgeAbortRef.current.signal
        );
      }
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
      try {
        await ensureErc20Approvals(wallet, evmTx);
      } catch (error) {
        if (isBridgeAbortError(error)) throw error;
        await abortWalletFlow(wallet, yominetChainId, error);
      }

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
        await abortWalletFlow(wallet, yominetChainId, error);
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
        `Bridging:\n**${sourceChain.label}** → **Yominet**\nCome back in 5 minutes!`
      );
      releaseBridgeProcessWhenWalletSettles(wallet, yominetChainId);
      return hash;
    };

    const persistCompletion = () => {
      const persisted = loadBridgePolling();
      if (persisted)
        saveBridgePolling({ ...persisted, updates: updatesRef.current, completed: true });
    };

    // after a successful bridge, advance a new player to the registration
    // screen instead of leaving them parked on the modal. existing accounts
    // (topping up mid-game) keep the modal open
    const scheduleAutoAdvance = () => {
      if (queryAccountFromEmbedded(network)) return;
      cancelAutoAdvance();
      // bind the timer to the wallet it was scheduled for — a completion for
      // wallet A must never close a modal wallet B opened during the delay
      const sessionAddress = selectedAddress;
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        autoAdvanceTimerRef.current = null;
        if (useNetwork.getState().selectedAddress !== sessionAddress) return;
        // callers reset phase to idle right after completion; anything else
        // means a new bridge attempt started during the delay
        if (phaseRef.current !== 'idle') return;
        if (queryAccountFromEmbedded(network)) return;
        setShouldResetOnNextOpen(true);
        setBridgeProcessActive(false);
        setModals({ bridge: false });
      }, AUTO_ADVANCE_DELAY_MS);
    };

    const waitForBridgeCompletion = async (
      pollingSourceChain: EVMChainOption,
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

        const transfer = await getBridgeTransferState(pollingSourceChain.chainId, sourceTxHash);
        const nextBalance = await getYominetTokenBalance(
          pollingSourceChain.destTokenAddress,
          selectedAddress
        );
        setYomiBalance(nextBalance);

        if (transfer.state === 'failed') {
          appendUpdate(
            'error',
            `The bridge transfer from ${pollingSourceChain.label} did not complete.`
          );
          persistCompletion();
          return;
        }

        if (transfer.state === 'success') {
          if (transfer.destTxHash) {
            appendUpdate(
              'success',
              `**Yominet** Tx: ${transfer.destTxHash}`,
              `${DefaultChain.blockExplorers?.default.url}/tx/${transfer.destTxHash}`
            );
          }
          appendUpdate('celebrate', 'Bridge Complete Congratulations');
          persistCompletion();
          scheduleAutoAdvance();
          return;
        }
      }

      // NOT persisted as completed: the transfer may still land — polling
      // auto-resumes on reload, and the Check Again button re-checks in place
      if (sourceTransactionStatus === 'success') {
        appendUpdate(
          'meta',
          `Source transaction confirmed on ${pollingSourceChain.label} — the Yominet transfer just hasn't been observed yet. It usually lands within minutes; hit Check Again below or come back later.`
        );
        setPollTimedOut(true);
        return;
      }

      appendUpdate(
        'meta',
        `Source transaction is still pending on ${pollingSourceChain.label}. Hit Check Again below once it confirms, or come back later.`
      );
      setPollTimedOut(true);
    };

    const findPersistedChain = (persisted: PersistedBridgePolling) =>
      (persisted.sourceOptionId
        ? SOURCE_CHAIN_OPTIONS.find((o) => o.id === persisted.sourceOptionId)
        : undefined) ?? SOURCE_CHAIN_OPTIONS.find((o) => o.chainId === persisted.sourceChainId);

    // re-enter polling from the persisted bridge state (used by the Check
    // Again button after a poll timeout)
    const retryPolling = () => {
      if (phaseRef.current !== 'idle') return;
      const persisted = loadBridgePolling();
      if (!persisted || persisted.selectedAddress !== selectedAddress) return;
      const chain = findPersistedChain(persisted);
      if (!chain) return;
      setPollTimedOut(false);
      appendUpdate('status', 'Checking for the Yominet transfer...');
      setBridgePhase('submitted');
      void trackBridgeTransaction(chain.chainId, persisted.sourceTxHash);
      waitForBridgeCompletion(chain, persisted.sourceTxHash, bridgeAbortRef.current.signal)
        .catch(() => {
          // transient RPC failure — keep the recovery path available
          appendUpdate('meta', 'Could not check right now. Try again in a moment.');
          setPollTimedOut(true);
        })
        .finally(() => {
          setBridgePhase('idle');
        });
    };

    const handleBridgeModalClose = () => {
      cancelAutoAdvance(); // a manual close during the celebration wins
      if (!isOpen || phaseRef.current === 'idle') return true;
      if (phaseRef.current === 'awaitingApproval' || phaseRef.current === 'approving') {
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
            (option) =>
              option.chainId === routeRequest.source_asset_chain_id &&
              (!routeRequest.source_asset_denom || option.denom === routeRequest.source_asset_denom)
          );
          if (requestedChain && !DISABLED_SOURCE_CHAIN_IDS.has(requestedChain.chainId)) {
            setSourceChain(requestedChain);
          }
          // the built routeRequest always carries a default amount_in — only
          // honor it when the caller explicitly passed one
          if (routeRequest.amount_in && details.explicitAmountIn) {
            try {
              setAmount(formatEther(BigInt(routeRequest.amount_in)));
              amountTouchedRef.current = true;
            } catch {
              // ignore malformed prefills
            }
          }
        }
      };

      window.addEventListener(BRIDGE_OPEN_REQUEST_EVENT, handleOpen);
      return () => window.removeEventListener(BRIDGE_OPEN_REQUEST_EVENT, handleOpen);
    }, []);

    // default the amount to Zevana's live price + operator gas headroom
    // (~0.01 total). purely a prefill: anything the user (or a route
    // request) typed wins, and mid-bridge the amount is never changed
    const vendorSystemAddress = getSystemAddr(world, components, NEWBIE_VENDOR_BUY_SYSTEM_ID);
    const vendorSystemKnown = !!vendorSystemAddress && vendorSystemAddress !== DEAD_ADDRESS;
    const { data: vendorPriceData } = useReadContract({
      address: vendorSystemAddress,
      abi: NewbieVendorBuySystem.abi as Abi,
      functionName: 'calcPrice',
      query: { enabled: isOpen && vendorSystemKnown },
    });
    // a fresh open takes the live default again — edits only stick for the
    // session the modal is open
    useEffect(() => {
      if (!isOpen) amountTouchedRef.current = false;
    }, [isOpen]);
    useEffect(() => {
      // isOpen dep: reopening must re-apply the default even when the cached
      // price is unchanged (the touched ref was just reset on close)
      if (!isOpen) return;
      if (amountTouchedRef.current || phaseRef.current !== 'idle') return;
      // the price + gas headroom is denominated in eth — meaningless for onyx
      if (sourceChain.asset !== 'ETH') return;
      const price = parseBigIntSafe(vendorPriceData);
      if (price === undefined) return;
      const total = price + PREFILL_OPERATOR_GAS_HEADROOM;
      const rounded =
        ((total + PREFILL_ROUNDING_STEP - 1n) / PREFILL_ROUNDING_STEP) * PREFILL_ROUNDING_STEP;
      setAmount(formatEther(rounded));
    }, [vendorPriceData, isOpen, sourceChain.asset]);

    useEffect(() => {
      if (!accountReady) return;
      const persisted = loadBridgePolling();
      if (!persisted || persisted.selectedAddress !== selectedAddress) return;

      const chain = findPersistedChain(persisted);
      if (!chain) {
        clearBridgePolling();
        return;
      }

      setSourceChain(chain);
      setUpdates(persisted.updates);

      if (persisted.completed) return;

      setBridgePhase('submitted');
      void trackBridgeTransaction(chain.chainId, persisted.sourceTxHash);
      waitForBridgeCompletion(chain, persisted.sourceTxHash, bridgeAbortRef.current.signal)
        .catch(() => {
          // transient RPC failure on the resumed poll — surface the retry path
          setPollTimedOut(true);
        })
        .finally(() => {
          setBridgePhase('idle');
        });
    }, [selectedAddress]);

    useEffect(() => {
      if (isOpen && shouldResetOnNextOpen) {
        clearBridgeState(false);
      }
    }, [isOpen, shouldResetOnNextOpen]);

    // probe which source chains the router can currently route from, and
    // steer the selection off a de-listed chain
    useEffect(() => {
      if (!isOpen) return;
      let stale = false;
      fetchRoutableSourceOptionIds(SOURCE_CHAIN_OPTIONS).then((ids) => {
        if (!stale) setRoutableOptionIds(ids);
      });
      return () => {
        stale = true;
      };
    }, [isOpen]);
    useEffect(() => {
      if (!routableOptionIds || routableOptionIds.has(sourceChain.id)) return;
      // stay on the asset the player picked — only steer to another of its chains
      const fallback = SOURCE_CHAIN_OPTIONS.find(
        (o) =>
          o.asset === sourceChain.asset &&
          routableOptionIds.has(o.id) &&
          !DISABLED_SOURCE_CHAIN_IDS.has(o.chainId)
      );
      if (fallback && phaseRef.current === 'idle') setSourceChain(fallback);
    }, [routableOptionIds, sourceChain.id]);

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

        const sourceTxHash = await submitBridgeTransaction(wallet, preparedBridge.evmTx);
        if (signal.aborted) throw createBridgeAbortError();
        saveBridgePolling({
          sourceTxHash,
          expectedAmountOut: preparedBridge.expectedAmountOut,
          sourceChainId: sourceChain.chainId,
          sourceOptionId: sourceChain.id,
          selectedAddress,
          updates: updatesRef.current,
          timestamp: Date.now(),
          completed: false,
        });
        void trackBridgeTransaction(sourceChain.chainId, sourceTxHash);
        await waitForBridgeCompletion(sourceChain, sourceTxHash, signal);
      } catch (error) {
        if (signal.aborted) return;
        if (!isBridgeAbortError(error)) {
          if (phaseRef.current === 'submitted') {
            // the tx already went out and polling state is persisted — a
            // transient poll failure here must surface the same recovery
            // path as the resumed poll, not read as a failed bridge
            appendUpdate('meta', 'Could not check right now. Try again in a moment.');
            setPollTimedOut(true);
          } else {
            appendUpdate('error', error instanceof Error ? error.message : 'Bridge failed');
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
          header={<ModalHeader title='Bridge to Yominet' icon={MenuIcons.kami} />}
          canExit
          onClose={handleBridgeModalClose}
          noScroll
          truncate
        >
          <Content tall={sourceChain.asset === 'ONYX'}>
            <BridgeForm
              sourceChain={sourceChain}
              routableOptionIds={routableOptionIds}
              amount={amount}
              parsedAmount={parsedAmount}
              sourceBalance={sourceBalance}
              yomiBalance={yomiBalance}
              isBridging={isBridging}
              accountReady={accountReady}
              onyxLocked={onyxLocked}
              hasSufficientSourceBalance={hasSufficientSourceBalance}
              onAmountChange={(value) => {
                amountTouchedRef.current = true;
                setAmount(value);
              }}
              onAssetChange={handleAssetChange}
              onSourceChainChange={setSourceChain}
              onSubmit={startBridge}
            />
            <BridgeUpdates updates={updates} isOpen={isOpen} />
            {pollTimedOut && !isBridging && (
              <CheckAgainButton type='button' onClick={retryPolling}>
                Check again
              </CheckAgainButton>
            )}
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

const CheckAgainButton = styled.button`
  align-self: center;
  margin-top: 0.4vw;
  padding: 0.35vw 1vw;
  border: 0.15vw solid #000000;
  border-radius: 0.5vw;
  background-color: #d6e4f8;
  font-size: 0.8vw;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    background-color: #c2d8f5;
  }
`;

const Content = styled.div<{ tall?: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 0.8vw;
  height: ${({ tall }) => (tall ? '25vw' : '22vw')};

  min-height: 0;
  padding: 0.3vw;
  overflow: hidden;
`;
