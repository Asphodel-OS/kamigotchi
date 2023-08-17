/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import { useAccount, useContractRead, useBalance } from 'wagmi';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Stepper } from 'layers/react/components/library/Stepper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { getAccount } from 'layers/react/shapes/Account';
import { getAccountData } from 'layers/react/shapes/Data';
import { Kami, queryKamisX } from 'layers/react/shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings';

import mintSound from 'assets/sound/fx/vending_machine.mp3';
import { abi } from "abi/Pet721ProxySystem.json"
import { use } from 'matter';
import { getConfigFieldValue } from 'layers/react/shapes/Config';

export function registerKamiMintModal() {
  registerUIComponent(
    'KamiMint',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 18,
      rowEnd: 80,
    },
    (layers) => {
      const {
        network: {
          network,
          components: {
            IsPet,
            IsAccount,
            OperatorAddress,
            State,
            Value,
          },
          systems,
        },
      } = layers;

      return merge(IsPet.update$, Value.update$, State.update$).pipe(
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

          const account = getAccount(layers, accountIndex, { kamis: true });
          const numMinted = getAccountData(layers, account, "NUM_MINT20_MINTED");
          const unrevealedKamis = queryKamisX(
            layers,
            { account: account.id, state: 'UNREVEALED' }
          ).reverse();


          return {
            layers,
            data: {
              account: {
                mint20: {
                  balance: 0, // TODO?: seems this is supported by wagmi hook
                  minted: getAccountData(layers, account, "NUM_MINT20_MINTED"),
                  limit: getConfigFieldValue(layers.network, "MINT_ACCOUNT_MAX"),
                },
                kamis: {
                  unrevealed: unrevealedKamis,
                }
              },
              mint20: {
                proxyAddress: systems["system.Farm20.Proxy"].address,
                cost: getConfigFieldValue(layers.network, "MINT_PRICE"),
                redeemed: 0, // TODO?: seems this is supported by wagmi hook
                supply: 0, // TODO?: seems this is supported by wagmi hook
                limit: getConfigFieldValue(layers.network, "MINT_INITIAL_MAX"),
              },
              numMinted,
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
      const { visibleModals, setVisibleModals, sound: { volume } } = dataStore();
      const { details: accountDetails } = useKamiAccount();
      const { selectedAddress, networks } = useNetworkSettings();

      const [amountToMint, setAmountToMint] = useState(1);
      const [triedReveal, setTriedReveal] = useState(false);
      const [waitingToReveal, setWaitingToReveal] = useState(false);

      useEffect(() => {
        const tx = async () => {
          if (isConnected && !triedReveal) {
            setTriedReveal(true);
            // wait to give buffer for OP rpc
            await new Promise((resolve) => setTimeout(resolve, 3000));
            data.account.kamis.unrevealed.forEach((kami) => {
              revealTx(kami);
            });
            if (waitingToReveal) {
              setWaitingToReveal(false);
              setVisibleModals({ ...visibleModals, kamiMint: false, party: true });
            }
          }
        }
        tx();

        // settriedReveal(false);
      }, [data.account.kamis.unrevealed]);


      ///////////////
      // COUNTER

      const { data: mint20Addy } = useContractRead({
        address: systems["system.Mint20.Proxy"].address as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy'
      });

      const { data: accountMint20Bal } = useBalance({
        address: accountDetails.ownerAddress as `0x${string}`,
        token: mint20Addy as `0x${string}`,
        watch: true
      });

      const { data: mint20Supply } = useContractRead({
        address: mint20Addy as `0x${string}`,
        abi:
          [{
            "inputs": [],
            "name": "getTotalMinted",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          },],
        functionName: 'getTotalMinted',
        watch: true,
      });


      /////////////////
      // ACTIONS

      // transaction to mint the Kami NFT (with Mint ERC20)
      const mintPetTx = (amount: number) => {
        const network = networks.get(selectedAddress);
        const api = network!.api.player;

        const actionID = (amount == 1 ? `Minting Kami` : `Minting Kamis`) as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.mint.mintPet(amount);
          },
        });
        return actionID;
      };

      // transaction to mint the Mint ERC20 Token
      const mintTokenTx = (amount: number, value: number) => {
        const network = networks.get(selectedAddress);
        const api = network!.api.player;

        const actionID = (amount == 1 ? `Minting Token` : `Minting Tokens`) as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.mint.mintToken(amount, value);
          },
        });
        return actionID;
      }

      // transaction to roll/reveal the kami's metadata 
      const revealTx = async (kami: Kami) => {
        const actionID = (`Revealing Kami ` + BigInt(kami.index).toString(10)) as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return player.ERC721.reveal(kami.index);
          },
        });
        await waitForActionCompletion(
          actions.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
      };

      const handlePetMinting = (amount: number) => async () => {
        try {
          setWaitingToReveal(true);
          const mintActionID = mintPetTx(amount);
          await waitForActionCompletion(
            actions.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          setTriedReveal(false);

          const mintFX = new Audio(mintSound);
          mintFX.volume = volume * 0.6;
          mintFX.play();
        } catch (e) {
          console.log('KamiMint.tsx: handlePetMinting() mint failed', e);
        }
      };

      const handleTokenMinting = (amount: number, value: number) => async () => {
        try {
          const mintActionID = mintTokenTx(amount, value);

          const mintFX = new Audio(mintSound);
          mintFX.volume = volume * 0.6;
          mintFX.play();
        } catch (e) {
          console.log('KamiMint.tsx: handleTokenMinting() mint failed', e);
        }
      };


      ///////////////
      // DISPLAY

      const QuantityButton = (delta: number) => {
        return (
          <QunatityStepper onClick={() => setAmountToMint(amountToMint + delta)}>
            {delta > 0 ? '+' : '-'}
          </QunatityStepper>
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

      const MintTokenButton = (text: string, amount: number, cost: number) => {
        return (
          <ActionButton id='button-mint' onClick={handleTokenMinting(amount, cost)} size='vending' text={text} inverted />
        );
      }

      const PetQuantityBox = () => {
        if (waitingToReveal) {
          // waiting to reveal - dont leave the page!
          return (
            <SubText>Revealing... don't leave this page!</SubText>
          );
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

      const CoinMachine = (
        <Grid>
          <SubHeader style={{ gridRow: 1 }}>
            Get $KAMI
          </SubHeader>
          <ProductBox style={{ gridRow: 2 }}>
            <VendingText>1 $KAMI</VendingText>
            {MintTokenButton("0.00Ξ", 1, 0.0)}
          </ProductBox>
          <ProductBox style={{ gridRow: 3 }}>
            <VendingText>3 $KAMI</VendingText>
            {MintTokenButton("0.06Ξ", 3, 0.06)}
          </ProductBox>
          <ProductBox style={{ gridRow: 4 }}>
            <VendingText>5 $KAMI</VendingText>
            {MintTokenButton("0.10Ξ", 5, 0.1)}
          </ProductBox>
          <SubText style={{ gridRow: 5 }}>
            Total Supply: {Number(mint20Supply)} / {data.mint20.limit}
          </SubText>
          <SubText style={{ gridRow: 6 }}>
            Address Limit: {data.account.mint20.minted} / {data.account.mint20.limit}
          </SubText>
        </Grid>
      );

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

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, kamiMint: false });
      }, [setVisibleModals, visibleModals]);


      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          handlePetMinting(amountToMint);
        }
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmountToMint(Number(event.target.value));
      };

      return (
        <ModalWrapperFull divName='kamiMint' id='kamiMintModal' hideModal={{ party: false }}>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Stepper steps={steps} PetMachine={PetMachine} CoinMachine={CoinMachine} />
        </ModalWrapperFull>
      );
    }
  );
}

const StepOne = () => (
  <>
    <Description style={{ display: 'grid', height: '100%', alignContent: 'center' }}>
      <Header style={{ color: 'black' }}>Vending Machine</Header>
      <br />
      There's some sort of vending machine here. A machine for NFTs. You hope it can be trusted.
    </Description>
  </>
);

const StepTwo = (props: any) => {
  const { CoinMachine, PetMachine } = props;

  return (
    <>
      <Header style={{ color: 'black' }}>Vending Machine</Header>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '24px' }}>
        {PetMachine}
        {CoinMachine}
      </div>
    </>
  );
};

const steps = (props: any) => [
  {
    title: 'One',
    content: <StepOne />,
  },
  {
    title: 'Two',
    content: <StepTwo PetMachine={props.PetMachine} CoinMachine={props.CoinMachine} />,
    modalContent: true,
  },
];


const Description = styled.div`
  font-size: 20px;
  color: #333;
  text-align: center;
  padding: 10px;
  font-family: Pixel;
`;

const Header = styled.p`
  font-size: 24px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const Grid = styled.div`
  display: grid;
  grid-row-gap: 6px;
  grid-column-gap: 12px;
  justify-items: center;
  justify-content: center;

  padding: 24px 6px;
  margin: 0px 6px;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  border-radius: 5px;
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

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background - color: #c4c4c4;
  }
  margin: 0px;
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
  font-size: 16px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const SubText = styled.div`
  font-size: 12px;
  color: #000;
  text-align: center;
  padding: 4px 6px 0px 6px;
  font-family: Pixel;
`;

const QunatityStepper = styled.button`
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

const VendingText = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;

  padding: 6px 0px 0px 0px;
`;
