// Modules on the sync-worker import chain read `self` at load time (utils/logger,
// cache/db); node has no `self`, so without this they throw on import.
(globalThis as any).self ??= globalThis;
