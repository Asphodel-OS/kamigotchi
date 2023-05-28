/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState, useCallback } from 'react';
import { EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import 'layers/react/styles/font.css';
import { map, merge } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import styled, { keyframes } from 'styled-components';
import { EntityID } from '@latticexyz/recs';
import { Stepper } from '../library/Stepper';
import { ModalWrapperFull } from '../library/ModalWrapper';
import { Kami, getKami } from 'layers/react/components/shapes/Kami';
import { Account, getAccount } from '../shapes/Account';
import { BigNumberish } from 'ethers';

import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { dataStore } from 'layers/react/store/createStore';
import { useAccount, useBalance, useContractRead } from 'wagmi';

import { abi } from "../../../../../abi/ERC721ProxySystem.json"

export function registerERC721BridgeModal() {
  registerUIComponent(
    'ERC721Bridge',
    {
      colStart: 34,
      colEnd: 68,
      rowStart: 9,
      rowEnd: 76,
    },
    (layers) => {
      const {
        network: {
          network,
          components: {
            AccountID,
            IsAccount,
            IsPet,
            OperatorAddress,
            State,
          },
          systems,
        },
      } = layers;

      return merge(
        AccountID.update$,
        State.update$
      ).pipe(
        map(() => {
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];

          const account =
            accountIndex !== undefined ? getAccount(layers, accountIndex) : ({} as Account);

          const kamis: Kami[] = [];
          if (account) {
            // get the kamis on this account
            const kamiIndices = Array.from(
              runQuery([Has(IsPet), HasValue(AccountID, { value: account.id })])
            );

            // get all kamis
            for (let i = 0; i < kamiIndices.length; i++) {
              kamis.push(getKami(layers, kamiIndices[i]));
            }
          }

          return {
            data: {
              account: { ...account, kamis },
            } as any,
            proxyAddy: systems["system.ERC721.Proxy"].address,
          };
        })
      );
    },

    ({ data, proxyAddy }) => {

      const { details: accountDetails } = useKamiAccount();
      const { selectedEntities, visibleModals, setVisibleModals, networks } = dataStore();
      const [placeholderInput, setPlaceholderInput] = useState('');

      //////////////////
      // TRANSACTIONS //

      // TODO: pets without accounts are linked to EOA, no account. link EOA
      const depositTx = (tokenID: BigNumberish) => {
        const {
          actions,
          api: { player: { ERC721 } }
        } = networks.get(accountDetails.ownerAddress);

        const actionID = `Importing $KAMI` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return ERC721.deposit(tokenID);
          },
        });
        return actionID;
      };

      const withdrawTx = (tokenID: BigNumberish) => {
        const {
          actions,
          api: { player: { ERC721 } }
        } = networks.get(accountDetails.ownerAddress);

        const actionID = `Exporting $KAMI` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return ERC721.withdraw(tokenID);
          },
        });
        return actionID;
      };

      //////////////////
      // MODAL LOGIC //

      // for use in mud
      const buttonSelect = (props: any) => {
        if (isExportable(props.kami)) {
          return (<Button onClick={() => withdrawTx(props.kami.index)}>Withdraw Kami</Button>);
        } else if (isImportable(props.kami)) {
          return (<Button onClick={() => depositTx(props.kami.index)}>Deposit Kami</Button>);
        }
        // specific conditions that disable bridging 
        else if (isHarvesting(props.kami)) {
          return (<NotButton>Kami Harvesting...</NotButton>);
        } else if (isDead(props.kami)) {
          return (<NotButton>Kami dead!</NotButton>);
        } else {
          return (<NotButton>cannot be bridged</NotButton>);
        }
      }

      // for use in EOA
      const { data: erc721 } = useContractRead({
        address: proxyAddy as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy'
      });
      const { data: erc721List } = useContractRead({
        address: erc721 as `0x${string}`,
        abi:
          [{
            "inputs": [
              {
                "internalType": "address",
                "name": "owner",
                "type": "address"
              }
            ],
            "name": "getAllTokens",
            "outputs": [
              {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }],
        functionName: 'getAllTokens',
        args: [accountDetails.ownerAddress as `0x${string}`]
      });

      console.log(erc721List);

      const KamiCard = (props: any) => {
        return (
          <Card>
            <Image src={props.image} />
            <Container>
              <TitleBar>
                <TitleText>{props.title}</TitleText>
              </TitleBar>
              {buttonSelect(props)}
            </Container>
          </Card>
        );
      };

      // Rendering of Individual Kami Cards in the Party Modal
      const KamiCards = (kamis: Kami[]) => {
        return kamis.map((kami) => {
          return (
            <KamiCard
              kami={kami}
              image={kami.uri}
              title={kami.name}
            />
          );
        });
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPlaceholderInput(event.target.value);
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, bridgeERC721: false });
      }, [setVisibleModals, visibleModals]);

      //////////////////
      //  KAMI LOGIC  //

      const isImportable = (kami: Kami): boolean => {
        return isOutOfWorld(kami);
      }

      const isExportable = (kami: Kami): boolean => {
        return isResting(kami);
      }

      // naive check right now, needs to be updated with murder check as well
      const isDead = (kami: Kami): boolean =>
        kami.state === 'DEAD';

      const isHarvesting = (kami: Kami): boolean =>
        kami.state === 'HARVESTING' && kami.production != undefined;

      const isResting = (kami: Kami): boolean =>
        kami.state === 'RESTING';

      const isOutOfWorld = (kami: Kami): boolean =>
        kami.state === '721_EXTERNAL';

      return (
        <ModalWrapperFull id='ERC721Bridge' divName='ERC721Bridge' fill={false} >
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Scrollable>{KamiCards(data.account.kamis)}</Scrollable>
        </ModalWrapperFull >
      );
    }
  );
}


const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Card = styled.div`
  background-color: #fff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  margin: 0px 2px 4px 2px;

  display: flex;
  flex-flow: row nowrap;
`;

const Container = styled.div`
  border-color: black;
  border-width: 2px;
  color: black;
  margin: 0px;
  padding: 0px;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;

const Image = styled.img`
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
  height: 110px;
  margin: 0px;
  padding: 0px;

  &:hover {
    opacity: 0.75;
  }
`;

const Input = styled.input`
  width: 100%;

  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;
  margin: 10px 5px 5px 5px;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
`;

const Button = styled.button`
  cursor: pointer;
  &:active {
    background-color: #c4c4c4;
  }
  font-family: Pixel;
  font-size: 14px;
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;

  padding: 5px;
  pointer-events: auto;
  margin: 5px;
`;

const NotButton = styled.div`
  text-align: center;
  font-family: Pixel;
  font-size: 14px;
  background-color: #c4c4c4;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  padding: 5px;
  pointer-events: auto;
  margin: 5px;
`;

const TitleBar = styled.div`
  border-style: solid;
  border-width: 0px 0px 2px 0px;
  border-color: black;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const TitleText = styled.p`
  padding: 6px 9px;

  font-family: Pixel;
  font-size: 14px;
  text-align: left;
  justify-content: flex-start;

  &:hover {
    opacity: 0.6;
  }
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
    background-color: #c4c4c4;
  }
  margin: 0px;
`;

const AlignRight = styled.div`
  text-align: left;
  margin: 0px;
`;
