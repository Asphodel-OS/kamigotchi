import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import { useAccount, useContractRead, useBalance } from 'wagmi';
import crypto from "crypto";

import { abi } from "abi/Pet721ProxySystem.json"
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { getAccount } from 'layers/react/shapes/Account';
import { getConfigFieldValue } from 'layers/react/shapes/Config';
import { getData } from 'layers/react/shapes/Data';
import { GachaCommit, isGachaAvailable } from 'layers/react/shapes/Gacha';
import { useVisibility } from 'layers/react/store/visibility';
import { useAccount as useKamiAccount } from 'layers/react/store/account';
import { useNetwork } from 'layers/react/store/network';
import { playVending } from 'utils/sounds';


export function registerKamiMintModal() {
  registerUIComponent(
    'KamiMint',
    {
      colStart: 30,
      colEnd: 70,
      rowStart: 30,
      rowEnd: 75,
    },
    (layers) => {
      const {
        network: {
          network,
          components: {
            IsPet,
            IsAccount,
            OperatorAddress,
            RevealBlock,
            State,
            Value,
          },
        },
      } = layers;

      return merge(IsPet.update$, RevealBlock.update$, Value.update$, State.update$).pipe(
        map(() => {
          // get the account through the account entity of the controlling wallet
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];

          const account = getAccount(layers, accountIndex, { kamis: true, gacha: true });

          const commits = [...account.gacha ? account.gacha.commits : []].reverse();

          return {
            layers,
            data: {
              account: {
                mint20: {
                  minted: getData(layers, account.id, "MINT20_MINT"),
                  limit: getConfigFieldValue(layers.network, "MINT_ACCOUNT_MAX"),
                },
                commits: commits,
              },
            }
          };
        })
      );
    },

    ({ layers, data }) => {
      const {
        network: {
          actions,
          api: { player },
          systems,
          world,
          network: { blockNumber$ }
        },
      } = layers;

      const { isConnected } = useAccount();
      const { modals, setModals } = useVisibility();
      const { account: kamiAccount } = useKamiAccount();
      const { selectedAddress, networks } = useNetwork();

      const [amountToMint, setAmountToMint] = useState(1);
      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);
      const [blockNumber, setBlockNumber] = useState(0);

      useEffect(() => {
        const sub = blockNumber$.subscribe((block) => {
          setBlockNumber(block);
        });

        return () => sub.unsubscribe();
      }, []);

      useEffect(() => {
        const tx = async () => {
          if (isConnected && !triedReveal) {
            setTriedReveal(true);
            // wait to give buffer for OP rpc
            await new Promise((resolve) => setTimeout(resolve, 500));
            const filtered = data.account.commits.filter((n) => {
              return isGachaAvailable(n, blockNumber);
            });
            revealTx(filtered);
            if (waitingToReveal) {
              setWaitingToReveal(false);
              setModals({ ...modals, kamiMint: false, party: true });
            }
          }
        }
        tx();

      }, [data.account.commits]);


      ///////////////
      // COUNTER

      const { data: mint20Addy } = useContractRead({
        address: systems["system.Mint20.Proxy"].address as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy'
      });

      const { data: accountMint20Bal } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
        token: mint20Addy as `0x${string}`,
        watch: true
      });

      /////////////////
      // ACTIONS

      // transaction to mint the Kami NFT (with Mint ERC20)
      const mintPetTx = (amount: number) => {
        const network = networks.get(selectedAddress);
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiMint',
          params: [amount],
          description: `Minting ${amount} Kami`,
          execute: async () => {
            return api.mint.mintPet(amount);
          },
        });
        return actionID;
      };

      // transaction to reveal a gacha result
      const revealTx = async (commits: GachaCommit[]) => {
        const toReveal = commits.map((n) => n.id);
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReveal',
          params: [commits.length],
          description: `Revealing ${commits.length} Gacha rolls`,
          execute: async () => {
            return player.mint.reveal(toReveal);
          },
        });

        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
      };

      const handlePetMinting = (amount: number) => async () => {
        try {
          setWaitingToReveal(true);
          const mintActionID = mintPetTx(amount);
          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          setTriedReveal(false);
          playVending();
        } catch (e) {
          console.log('KamiMint.tsx: handlePetMinting() mint failed', e);
        }
      };


      ///////////////
      // DISPLAY

      const QuantityButton = (delta: number) => {
        return (
          <QuantityStepper onClick={() => amountToMint + delta > 0 ? setAmountToMint(amountToMint + delta) : 0}>
            {delta > 0 ? '+' : '-'}
          </QuantityStepper>
        );
      }

      const MintPetButton = () => {
        if (waitingToReveal) {
          return (<div></div>)
        } else {
          const enabled = (amountToMint <= Number(accountMint20Bal?.formatted));
          const warnText = enabled ? '' : 'Insufficient $KAMI';
          return (
            <Tooltip text={[warnText]}>
              <ActionButton id='button-mint' onClick={handlePetMinting(amountToMint)} size='vending' text="Mint" inverted disabled={!enabled} />
            </Tooltip>
          );
        }
      }

      const PetQuantityBox = () => {
        if (waitingToReveal) {
          return (<SubText>Revealing... don't leave this page!</SubText>);
        } else {
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px 0px 0px' }}>
              <div style={{ width: '50%' }}>
                <SubText style={{ color: '#555', padding: '2px' }}>Qty</SubText>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {QuantityButton(-1)}
                  <Input
                    style={{ pointerEvents: 'auto' }}
                    type='number'
                    onKeyDown={(e) => catchKeys(e)}
                    placeholder='0'
                    onChange={(e) => handleChange(e)}
                    value={amountToMint}
                  />
                  {QuantityButton(1)}
                </div>
              </div>
              <div style={{ width: '50%' }}>
                <SubText style={{ color: '#555', padding: '2px' }}>Cost</SubText>
                <SubText>{amountToMint} $KAMI</SubText>
              </div>
            </div>
          );
        }
      }

      const PetMachine = (
        <Grid>
          <SubHeader style={{ gridRow: 1 }}>
            Mint Kamigotchi
          </SubHeader>
          <div style={{ gridRow: 2 }}>
            <KamiImage src='https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif' />
          </div>
          <ProductBox style={{ gridRow: 3 }}>
            {PetQuantityBox()}
            {MintPetButton()}
          </ProductBox>
          <SubText style={{ gridRow: 4 }}>
            You have: {Number(accountMint20Bal?.formatted)} $KAMI
          </SubText>
        </Grid>
      );

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          handlePetMinting(amountToMint);
        }
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (Number(event.target.value) > 0) setAmountToMint(Number(event.target.value));
      };

      return (
        <ModalWrapper
          divName='kamiMint'
          id='kamiMintModal'
          overlay
          canExit
        >
          {PetMachine}
        </ModalWrapper>
      );
    }
  );
}

const Grid = styled.div`
  display: grid;
  grid-row-gap: 6px;
  grid-column-gap: 12px;
  justify-items: center;
  justify-content: center;

  padding: 24px 6px;
  margin: 0px 6px;
`;

const Input = styled.input`
  width: 50%;

  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  justify-content: center;
  font-family: Pixel;

  border-width: 0px;
  padding: 6px;

  &:focus {
    outline: none;
  }

  ::-webkit-inner-spin-button{
    -webkit-appearance: none; 
    margin: 0; 
  }
  ::-webkit-outer-spin-button{
    -webkit-appearance: none; 
    margin: 0; 
  }  
`;

const KamiImage = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  height: 90px;
  margin: 0px;
  padding: 0px;
`;

const ProductBox = styled.div`
  border-color: black;
  border-radius: 2px;
  border-style: solid;
  border-width: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 5px;
  max-width: 75%;
`;

const SubHeader = styled.p`
  color: #333;

  padding: 1.5vw;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;

const SubText = styled.div`
  font-size: 12px;
  color: #000;
  text-align: center;
  padding: 4px 6px 0px 6px;
  font-family: Pixel;
`;

const QuantityStepper = styled.button`
  font-size: 16px;
  color: #777;
  text-align: center;
  font-family: Pixel;

  border-style: none;
  background-color: transparent;

  &:hover {
    color: #000;  
  }
`;
