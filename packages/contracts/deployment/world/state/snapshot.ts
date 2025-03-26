import { AdminAPI } from '../api';

export async function initSnapshot(api: AdminAPI) {
  await initTransferKamis(api);
  await initTransferItems(api);
}

async function initTransferKamis(api: AdminAPI) {}

async function initTransferItems(api: AdminAPI) {}
