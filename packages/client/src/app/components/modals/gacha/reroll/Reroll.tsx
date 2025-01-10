import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { ActionButton, Tooltip } from 'app/components/library';
import { useNetwork, useVisibility } from 'app/stores';
import { BigNumber, ethers } from 'ethers';
import { Kami } from 'network/shapes/Kami';
import { KamiGrid } from '../components/KamiGrid';
import { TabType } from '../types';
import { SideBalance } from './SideBalance';

interface Props {
  actions: {
    handleReroll: (kamis: Kami[], price: bigint) => Promise<void>;
  };
  tab: TabType;
  data: {
    accountEntity: EntityIndex;
    balance: bigint;
    maxRerolls: number;
    onyxAddress: string;
    ownerAddress: string;
  };
  utils: {
    getRerollCost: (kami: Kami) => bigint;
    getAccountKamis: () => Kami[];
  };
  networkActions: any;
}

export const Reroll = (props: Props) => {
  const { actions, data, utils, tab, networkActions } = props;
  const { accountEntity, maxRerolls, balance, onyxAddress, ownerAddress } = data;
  const { getAccountKamis, getRerollCost } = utils;
  const { modals } = useVisibility();
  const [partyKamis, setPartyKamis] = useState<Kami[]>([]);
  const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
  const [rerollPrice, setRerollPrice] = useState<bigint>(BigInt(0));
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [enoughBalance, setEnoughBalance] = useState<boolean>(false);
  const { selectedAddress, apis, signer } = useNetwork();

  /////////////////
  // ONYXApproval
  const gachaRerollAddress = () => {
    const api = apis.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);
    return api.address.gachaReroll();
  };
  async function getContracts() {
    const erc20Interface = new ethers.utils.Interface([
      'function allowance(address owner, address spender) view returns (uint256)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
    ]);

    // TODO: get this from other place, signer is fake and wont work for approval?
    const onyxContract = new ethers.Contract(onyxAddress, erc20Interface, signer);
    const contractAddress = gachaRerollAddress();
    return { onyxContract, contractAddress };
  }

  async function checkOnyxAllowance(threshold: ethers.BigNumber) {
    const { onyxContract, contractAddress } = await getContracts();
    try {
      const allowance = await onyxContract.allowance(ownerAddress, contractAddress);
      // using gt instead of gte because threshold 0 needs to be checked
      if (allowance.gt(threshold)) {
        setIsAllowed(true);
      } else {
        setIsAllowed(false);
      }
    } catch (error: any) {
      setIsAllowed(false);
      throw new Error(`Approval failed: ${error.message}`);
    }
  }

  async function checkUserBalance(threshold: ethers.BigNumber) {
    const { onyxContract } = await getContracts();
    try {
      const balance = await onyxContract.balanceOf(ownerAddress);
      setEnoughBalance(balance.gt(threshold));
    } catch (error: any) {
      setEnoughBalance(false);
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }

  const approveTx = async () => {
    const api = apis.get(selectedAddress);
    if (!api) return console.error(`API not established for ${selectedAddress}`);
    const { onyxContract, contractAddress } = await getContracts();
    const actionID = uuid() as EntityID;
    networkActions!.add({
      id: actionID,
      action: 'ApproveONYX',
      description: 'Approving ONYX for GachaReroll',
      execute: async () => {
        return onyxContract.approve(contractAddress, rerollPrice + BigInt(1));
      },
    });
  };

  // ticking
  useEffect(() => {
    const refresh = () => setLastRefresh(Date.now());
    const timerId = setInterval(refresh, 1000);
    return () => clearInterval(timerId);
  }, []);

  // update the list of kamis when the account changes
  useEffect(() => {
    if (tab !== 'REROLL' || !modals.gacha) return;
    const party = getAccountKamis().filter((kami) => kami.state === 'RESTING');
    setPartyKamis(party);
  }, [accountEntity, lastRefresh]);

  // update the reroll price of each kami when the list changes
  useEffect(() => {
    let price = BigInt(0);
    selectedKamis.forEach((kami) => (price += getRerollCost(kami)));
    setRerollPrice(price);
    checkOnyxAllowance(BigNumber.from(price));
    isAllowed && checkUserBalance(BigNumber.from(price));
  }, [selectedKamis]);

  //////////////////
  // INTERACTION

  const handleReroll = () => {
    actions.handleReroll(selectedKamis, rerollPrice);
    setSelectedKamis([]);
  };

  //////////////////
  // INTERPRETATION

  const canRerollSelected = () => {
    let rerollPrice = BigInt(0);
    for (const kami of selectedKamis) {
      if (kami.rerolls ?? 0 >= maxRerolls) return false;
      rerollPrice += getRerollCost(kami);
    }
    if (rerollPrice > balance) return false;
    return true;
  };

  //////////////////
  // DISPLAY

  const getKamiText = (kami: Kami): string[] => {
    const text = [];
    text.push(kami.name);
    text.push('');
    text.push(`Re-roll cost: ${props.utils.getRerollCost(kami)} Ξ`);
    text.push(`Re-rolls done: ${kami.rerolls?.toString()} / ${maxRerolls}`);
    return text;
  };

  const Grid =
    partyKamis.length > 0 ? (
      <KamiGrid
        kamis={partyKamis}
        getKamiText={getKamiText}
        amtShown={partyKamis.length} // here if truncation makes sense later
        grossShowable={partyKamis.length}
        incAmtShown={() => {}}
        select={{
          arr: selectedKamis,
          set: setSelectedKamis,
        }}
      />
    ) : (
      <div
        style={{
          height: '60%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <EmptyText>No kamigotchis to re-roll!</EmptyText>
        <EmptyText>(Only happy and healthy kamis can be re-rolled)</EmptyText>
      </div>
    );
  console.log(`isAllowed ${isAllowed}`);
  return (
    <OuterBox>
      {Grid}
      <Footer>
        <SideBalance balance={maxRerolls.toString()} title='Re-roll cost' />
        <div style={{ flexGrow: 6 }} />
        {isAllowed || selectedKamis.length === 0 ? (
          <Tooltip
            text={isAllowed === true && enoughBalance === false ? ['Not enough balance'] : []}
          >
            <ActionButton
              onClick={handleReroll}
              text='Re-roll'
              size='large'
              disabled={
                selectedKamis.length === 0 || canRerollSelected() || enoughBalance === false
              }
              fill
            />{' '}
          </Tooltip>
        ) : (
          <ActionButton
            onClick={approveTx}
            text='Approve ONYX'
            size='large'
            disabled={selectedKamis.length === 0 || canRerollSelected()}
            fill
          />
        )}
      </Footer>
    </OuterBox>
  );
};

const Footer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  padding: 0.5vh 2vw 1vh;
`;

const OuterBox = styled.div`
  width: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 50vh;
  flex-grow: 1;
`;

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;

  width: 100%;
`;
