import { useVisibility } from 'app/stores';
import {
  BRIDGE_OPEN_REQUEST_EVENT,
  BridgeOpenerOptions,
  buildBridgeRouteRequest,
} from 'app/components/modals/bridge/helpers/api';
import { playClick } from 'utils/sounds';

export const triggerBridgeModal = (options: BridgeOpenerOptions = {}) => {
  const { setModals } = useVisibility.getState();
  playClick();

  window.dispatchEvent(
    new CustomEvent<BridgeOpenerOptions>(BRIDGE_OPEN_REQUEST_EVENT, {
      detail: {
        routeRequest: buildBridgeRouteRequest(options.routeRequest),
        // the built request always carries a default amount_in — only callers
        // that explicitly passed one should override the modal's own default
        explicitAmountIn: options.routeRequest?.amount_in != null,
      },
    })
  );

  setModals({ bridge: true });
};
