import { Wallet } from "ethers";
import { Providers } from "../providers/createProvider";

export function createSigner(privateKey: string, providers: Providers) {
  return new Wallet(privateKey, providers.json);
}
