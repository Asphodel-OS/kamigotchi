import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EntityID } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { useNetwork, useTokens } from 'app/stores';
import { NetworkLayer } from 'network/create';
import { Item } from 'network/shapes/Item';
import { getCompAddr } from 'network/shapes/utils';
import { ActionButton, ActionButtonProps } from './ActionButton';

interface Props extends ActionButtonProps {
  amount: number;
  network: NetworkLayer;
  token: Item; // use token item registry
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
    const api = apis.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);
    const actionID = uuid() as EntityID;
    actions.add({
      id: actionID,
      action: 'Approve token',
      params: [token.address!, spender, amount],
      description: `Approve ${token.name} to be spent by ${spender}`,
      execute: async () => {
        return api.erc20.approve(token.address!, spender, amount);
      },
    });
  };

  const onClick = () => {
    return approved ? props.onClick() : approveTx();
  };

  return <ActionButton {...props} onClick={onClick} text={approved ? props.text : 'Approve'} />;
};

const Container = styled.div<{ scale: number }>`
  border-right: 0.15vw solid black;
  background-color: black;
  height: 100%;
  width: ${({ scale }) => scale}vw;
  gap: 0.12vw;

  display: flex;
  flex-flow: column nowrap;
`;

const Button = styled.div<{ scale: number; disabled?: boolean }>`
  background-color: #fff;
  height: 100%;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  cursor: pointer;
  pointer-events: auto;
  user-select: none;

  color: black;
  font-size: ${({ scale }) => 0.6 * scale ** 0.5}vw;
  text-align: center;

  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }

  ${({ disabled }) =>
    disabled &&
    `
  background-color: #bbb; 
  cursor: default; 
  pointer-events: none;`}
`;
