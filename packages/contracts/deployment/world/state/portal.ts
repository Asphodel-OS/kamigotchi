import { AdminAPI } from '../api';

export async function addToken(api: AdminAPI) {
  // hardcoded ONYX
  await api.portal.token.set(100, '0x4BaDFb501Ab304fF11217C44702bb9E9732E7CF4', 3);
}

export async function deleteToken(api: AdminAPI, index: number) {
  await api.portal.token.unset(index);
}

/////////////////
// SCRIPTS

export async function initPortal(api: AdminAPI) {
  await addToken(api);
}

export async function initLocalPortal(api: AdminAPI) {
  await api.portal.token.localAdd(100);
}
