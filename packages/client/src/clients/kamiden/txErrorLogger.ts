import { log } from 'utils/logger';

const KAMIDEN_URL = import.meta.env.VITE_KAMIGAZE_URL;

interface TxErrorContext {
  sender: string;
  system: string;
  method: string;
  nonce: string;
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, (_, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
  } catch {
    return JSON.stringify({ message: 'Error serialization failed' });
  }
}

export async function logTxErrorToDB(error: unknown, context: TxErrorContext): Promise<void> {
  log.debug('[txErrorLogger] logTxErrorToDB called', { context, KAMIDEN_URL });

  if (!KAMIDEN_URL) {
    log.warn('[txErrorLogger] KAMIDEN_URL not set, skipping error logging');
    return;
  }

  try {
    const payload = {
      sender: context.sender,
      system: context.system,
      method: context.method,
      timestamp: Date.now(),
      error: error,
      nonce: context.nonce,
      hash: context.method,
    };

    log.debug('[txErrorLogger] Sending to backend', { url: `${KAMIDEN_URL}/tx-errors`, payload });

    const response = await fetch(`${KAMIDEN_URL}/tx-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify(payload),
    });

    log.debug('[txErrorLogger] Response', { status: response.status, ok: response.ok });
  } catch (e) {
    log.warn('[txErrorLogger] Failed to send error to backend', e);
  }
}
