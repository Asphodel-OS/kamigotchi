import { AdminAPI } from '../api';

export async function addToken(api: AdminAPI) {
  // hardcoded ONYX
  await api.bridge.token.add(100, '0x4BaDFb501Ab304fF11217C44702bb9E9732E7CF4');
}

export async function deleteToken(api: AdminAPI, index: number) {
  await api.bridge.token.remove(index);
}

/////////////////
// SCRIPTS

export async function initBridge(api: AdminAPI) {
  await addToken(api);
}

export async function initLocalBridge(api: AdminAPI) {
  await api.bridge.token.localAdd(100);
}
