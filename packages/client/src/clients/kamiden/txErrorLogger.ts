import { log } from 'utils/logger';

const KAMIDEN_URL = import.meta.env.VITE_KAMIGAZE_URL;

interface TxErrorContext {
  sender: string;
  system: string;
  method: string;
}

interface NormalizedError {
  name?: string;
  message?: string;
  code?: string | number;
  stack?: string;
  reason?: string;
  data?: unknown;
}

function normalizeError(error: unknown): NormalizedError {
  if (error === null || error === undefined) {
    return { message: 'Unknown error' };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    return {
      name: typeof err.name === 'string' ? err.name : undefined,
      message: typeof err.message === 'string' ? err.message : undefined,
      code: typeof err.code === 'string' || typeof err.code === 'number' ? err.code : undefined,
      reason: typeof err.reason === 'string' ? err.reason : undefined,
      data: err.data,
    };
  }

  return { message: String(error) };
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

export async function logTxError(error: unknown, context: TxErrorContext): Promise<void> {
  log.debug('[txErrorLogger] logTxError called', { context, KAMIDEN_URL });

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
