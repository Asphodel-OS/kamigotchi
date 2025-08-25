import { EntityID } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { utils } from 'ethers';
import { useEffect, useState } from 'react';
import { getAddress } from 'viem';

import { useNetwork, useTokens } from 'app/stores';
import { NetworkLayer } from 'network/create';
import { Item } from 'network/shapes/Item';
import { getCompAddr } from 'network/shapes/utils';
import { ActionButton } from './ActionButton';

// ActionButton wrapper for token approval/spend flows
// Overrides onClick with approval flow if approval needed
export const TokenButton = ({
  network: {
    actions,
    world,
    components,
  },
  token,
  amount,
  ...props
}: {
  network: NetworkLayer;
  token: Item; // use token item registry
  amount: number;
}) => {
  const { balances } = useTokens();
  const { selectedAddress, apis } = useNetwork();

  const [approved, setApproved] = useState(false);
  const [spender, setSpender] = useState<string>('');

  useEffect(() => {
    const allowAddress = getCompAddr(world, components, 'component.token.allowance');
    setSpender(utils.hexZeroPad(allowAddress, 20));
  }, [network]);

  useEffect(() => {
    const needsApproval = amount > (balances.get(token.address || '')?.allowance || 0);
    setApproved(!needsApproval);
  }, [balances]);

  ///////////////
  // FUNCTIONS

  const approveTx = async () => {
    const api = apis.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);
    const checksumAddr = getAddress(token.address!);
    const checksumSpender = getAddress(spender);

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
