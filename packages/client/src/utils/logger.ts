declare global {
  interface Window {
    setLogLevel: (level: string) => void;
    getLogLevel: () => string;
  }
  interface WorkerGlobalScope {
    setLogLevel: (level: string) => void;
    getLogLevel: () => string;
  }
}

// Works in both main thread (window) and web workers (self)
const globalScope: Window | WorkerGlobalScope =
  typeof window !== 'undefined' ? window : (self as unknown as WorkerGlobalScope);

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.TRACE]: 'TRACE',
};

// Default: INFO, configurable via VITE_LOG_LEVEL env var
const DEFAULT_LEVEL =
  LogLevel[import.meta.env.VITE_LOG_LEVEL as keyof typeof LogLevel] ?? LogLevel.INFO;

let currentLevel: LogLevel = DEFAULT_LEVEL;

// Debug: show what level was loaded
const context = typeof window !== 'undefined' ? 'main' : 'worker';
console.log(`[logger:${context}] initialized with level: ${LEVEL_NAMES[currentLevel]}`);

// Runtime control via console (works in main thread and workers)
globalScope.setLogLevel = (level: string) => {
  const normalized = level.toUpperCase();
  const found = Object.entries(LEVEL_NAMES).find(([, name]) => name === normalized);
  if (found) {
    currentLevel = Number(found[0]) as LogLevel;
    console.log(`Log level set to ${normalized}`);
  } else {
    console.log(`Invalid level. Use: ${Object.values(LEVEL_NAMES).join(', ')}`);
  }
};

globalScope.getLogLevel = () => LEVEL_NAMES[currentLevel];

function timestamp(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `[${h}:${m}:${s}.${ms}]`;
}

export const log = {
  error: (...args: unknown[]) => {
    if (currentLevel >= LogLevel.ERROR) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (currentLevel >= LogLevel.WARN) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (currentLevel >= LogLevel.INFO) console.log(...args);
  },
  debug: (...args: unknown[]) => {
    if (currentLevel >= LogLevel.DEBUG) console.log('DEBUG', ...args);
  },
  trace: (...args: unknown[]) => {
    if (currentLevel >= LogLevel.TRACE) console.log('TRACE', ...args);
  },
  time: {
    error: (...args: unknown[]) => {
      if (currentLevel >= LogLevel.ERROR) console.error(timestamp(), ...args);
    },
    warn: (...args: unknown[]) => {
      if (currentLevel >= LogLevel.WARN) console.warn(timestamp(), ...args);
    },
    info: (...args: unknown[]) => {
      if (currentLevel >= LogLevel.INFO) console.log(timestamp(), ...args);
    },
    debug: (...args: unknown[]) => {
      if (currentLevel >= LogLevel.DEBUG) console.log(timestamp(), 'DEBUG', ...args);
    },
    trace: (...args: unknown[]) => {
      if (currentLevel >= LogLevel.TRACE) console.log(timestamp(), 'TRACE', ...args);
    },
  },
};
