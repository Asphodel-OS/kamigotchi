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
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import { dataStore } from 'layers/react/store/createStore';
import { useAccount, useBalance, useContractRead } from 'wagmi';

import { abi } from "../../../../../abi/ERC721ProxySystem.json"

export function registerERC721BridgeModal() {
  registerUIComponent(
    'ERC721Bridge',
    {
      colStart: 28,
      colEnd: 74,
      rowStart: 15,
      rowEnd: 85,
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
            accountIndex !== undefined ? getAccount(layers, accountIndex, { kamis: true }) : ({} as Account);

          return {
            layers: layers,
            data: {
              account: { ...account },
            } as any,
            proxyAddy: systems["system.ERC721.Proxy"].address,
          };
        })
      );
    },

    ({ layers, data, proxyAddy }) => {

      const {
        network: {
          components: {
            IsPet,
            PetIndex
          }
        }
      } = layers;

      const { details: accountDetails } = useKamiAccount();
      const { visibleModals, setVisibleModals } = dataStore();
      const { selectedAddress, networks } = useNetworkSettings();

      const [EOAKamis, setEOAKamis] = useState<Kami[]>([]);

      //////////////////
      // TRANSACTIONS //

      // TODO: pets without accounts are linked to EOA, no account. link EOA
      const depositTx = (tokenID: BigNumberish) => {
        const network = networks.get(selectedAddress);
        const actions = network!.actions;
        const api = network!.api.player;

        const actionID = `Importing $KAMI` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.ERC721.deposit(tokenID);
          },
        });
        return actionID;
      };

      const withdrawTx = (tokenID: BigNumberish) => {
        const network = networks.get(selectedAddress);
        const actions = network!.actions;
        const api = network!.api.player;

        const actionID = `Exporting $KAMI` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.ERC721.withdraw(tokenID);
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

      // External Kamis
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
        args: [accountDetails.ownerAddress as `0x${string}`],
        watch: true,
      });

      useEffect(() => {
        // gets all kami entities externally owned 
        const getEOAKamis = (): Kami[] => {
          // get indexes of external kamis
          const getIndexes = (): bigint[] => {
            return erc721List ? [...erc721List] : [];
          }

          // get kamis from index
          const getKamis = (indexes: bigint[]): Kami[] => {
            let kamis: Kami[] = [];

            for (let i = 0; i < indexes.length; i++) {
              const entityID = Array.from(
                runQuery([
                  Has(IsPet),
                  HasValue(PetIndex, { value: '0x' + indexes[i].toString(16).padStart(2, '0') })
                ])
              )[0];

              kamis.push(getKami(layers, entityID, { deaths: true, production: true, traits: true }));
            }

            return kamis;
          }

          const indexes = getIndexes();
          return getKamis(indexes);
        }

        setEOAKamis(getEOAKamis());
      }, [erc721List, data]);

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
        <ModalWrapperFull id='bridgeERC721' divName='bridgeERC721' fill={false} >
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Title>Stake/Unstake Kamis</Title>
          <Grid>
            <Description style={{ gridRow: 1, gridColumn: 1 }}>
              In game
            </Description>
            <Scrollable style={{ gridRow: 2, gridColumn: 1 }}>
              {KamiCards(data.account.kamis)}
            </Scrollable>
            <Description style={{ gridRow: 1, gridColumn: 2 }}>
              Out of game
            </Description>
            <Scrollable style={{ gridRow: 2, gridColumn: 2 }}>
              {KamiCards(EOAKamis)}
            </Scrollable>
          </Grid>
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

const Description = styled.div`
  font-size: 16px;
  color: #333;
  text-align: center;
  padding: 10px;
  font-family: Pixel;
`;

const Grid = styled.div`
  display: grid;
  justify-content: center;
  align-items: center;
  grid-column-gap: 32px;
  max-height: 80%;
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

const Title = styled.div`
  font-size: 20px;
  color: #333;
  text-align: center;
  padding: 10px;
  font-family: Pixel;
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
