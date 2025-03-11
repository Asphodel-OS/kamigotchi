import { useEffect, useState } from 'react';
import { getAddress } from 'viem';

import { EntityID } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { useNetwork, useTokens } from 'app/stores';
import { NetworkLayer } from 'network/create';
import { Item } from 'network/shapes/Item';
import { getCompAddr } from 'network/shapes/utils';
import { ActionButton } from './ActionButton';

interface Props {
  network: NetworkLayer;
  token: Item; // use token item registry
  amount: number;
}

// ActionButton wrapper for token approval/spend flows
// Overrides onClick with approval flow if approval needed
export const TokenButton = (props: Props) => {
  const { amount, network, token } = props;
  const { actions, world, components } = network;
  const { balances } = useTokens();
  const { selectedAddress, apis } = useNetwork();

  const [approved, setApproved] = useState(false);
  const [spender, setSpender] = useState<string>('');

  useEffect(() => {
    setSpender(getCompAddr(world, components, 'component.token.allowance'));
  }, [network]);

  useEffect(() => {
    const needsApproval = amount > (balances.get(token.address || '')?.allowance || 0);
    setApproved(!needsApproval);
  }, [balances]);

  ///////////////
  // FUNCTIONS

  const approveTx = async () => {
    console.log(token.address, token.address?.length);
    console.log(spender, spender.length);
    const api = apis.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);
    const checksumAddr = getAddress(token.address!);
    const checksumSpender = getAddress(spender);
    console.log({ checksumAddr, checksumSpender });
    console.log({ len1: checksumAddr.length, len2: checksumSpender.length });

    const actionID = uuid() as EntityID;
    actions.add({
      id: actionID,
      action: 'Approve token',
      params: [checksumAddr, checksumSpender, amount],
      description: `Approve ${token.name} to be spent by ${checksumSpender}`,
      execute: async () => {
        return api.erc20.approve(checksumAddr, checksumSpender, amount);
      },
    });
  };

  return <ActionButton {...props} onClick={approveTx} text={'Approve'} />;
};
