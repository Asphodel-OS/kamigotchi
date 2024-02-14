import { EntityID, Has, HasValue, runQuery } from '@latticexyz/recs';
import crypto from 'crypto';
import { BigNumberish } from 'ethers';
import { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { useContractRead } from 'wagmi';

import { abi } from 'abi/Pet721ProxySystem.json';
import { Account, getAccount } from 'layers/network/shapes/Account';
import { Kami, getKami } from 'layers/network/shapes/Kami';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useAccount } from 'layers/react/store/account';
import { useNetwork } from 'layers/react/store/network';

import 'layers/react/styles/font.css';

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
          components: { AccountID, IsAccount, OperatorAddress, State },
          systems,
        },
      } = layers;

      return merge(AccountID.update$, State.update$).pipe(
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
            accountIndex !== undefined
              ? getAccount(layers.network, accountIndex, { kamis: true })
              : ({} as Account);

          return {
            layers: layers,
            data: {
              account: { ...account },
            } as any,
            proxyAddy: systems['system.Pet721.Proxy'].address,
          };
        })
      );
    },

    ({ layers, data, proxyAddy }) => {
      const {
        network: {
          components: { IsPet, PetIndex },
        },
      } = layers;

      const { account: kamiAccount } = useAccount();
      const { selectedAddress, networks } = useNetwork();

      const [EOAKamis, setEOAKamis] = useState<Kami[]>([]);

      //////////////////
      // TRANSACTIONS //

      // TODO: pets without accounts are linked to EOA, no account. link EOA
      const depositTx = (tokenID: BigNumberish) => {
        const network = networks.get(selectedAddress);
        const actions = network!.actions;
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString('hex') as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiDeposit',
          params: [tokenID],
          description: `Staking Kami ${tokenID}`,
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

        const actionID = crypto.randomBytes(32).toString('hex') as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiWithdraw',
          params: [tokenID],
          description: `Unstaking Kami ${tokenID}`,
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
          return <Button onClick={() => withdrawTx(props.kami.index)}>Unstake</Button>;
        } else if (isImportable(props.kami)) {
          return <Button onClick={() => depositTx(props.kami.index)}>Stake</Button>;
        }
        // specific conditions that disable bridging
        else if (isHarvesting(props.kami)) {
          return <NotButton>Harvesting...</NotButton>;
        } else if (isDead(props.kami)) {
          return <NotButton>Dead!</NotButton>;
        } else {
          return <NotButton>cannot be bridged</NotButton>;
        }
      };

      // External Kamis
      const { data: erc721 } = useContractRead({
        address: proxyAddy as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy',
      });
      const { data: erc721List } = useContractRead({
        address: erc721 as `0x${string}`,
        abi: [
          {
            inputs: [
              {
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
            ],
            name: 'getAllTokens',
            outputs: [
              {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'getAllTokens',
        args: [kamiAccount.ownerAddress as `0x${string}`],
        watch: true,
      });

      // update list of externally owned kamis
      useEffect(() => {
        const getEOAKamis = (): Kami[] => {
          // get indices of external kamis
          const getIndices = (): bigint[] => {
            return erc721List ? [...erc721List] : [];
          };

          // get kamis from index
          const getKamis = (indices: bigint[]): Kami[] => {
            let kamis: Kami[] = [];
            let petIndex;
            for (let i = 0; i < indices.length; i++) {
              petIndex = ('0x' + indices[i].toString(16).padStart(2, '0')) as unknown as number;
              const entityID = Array.from(
                runQuery([Has(IsPet), HasValue(PetIndex, { value: petIndex })])
              )[0];

              kamis.push(
                getKami(layers.network, entityID, {
                  deaths: true,
                  production: true,
                  traits: true,
                })
              );
            }

            return kamis;
          };

          const indices = getIndices();
          return getKamis(indices);
        };

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
        return kamis?.map((kami) => {
          return <KamiCard kami={kami} key={kami.index} image={kami.uri} title={kami.name} />;
        });
      };

      /////////////////
      //  KAMI LOGIC

      const isImportable = (kami: Kami): boolean => {
        return isOutOfWorld(kami);
      };

      const isExportable = (kami: Kami): boolean => {
        return isResting(kami);
      };

      // naive check right now, needs to be updated with murder check as well
      const isDead = (kami: Kami): boolean => kami.state === 'DEAD';

      const isHarvesting = (kami: Kami): boolean =>
        kami.state === 'HARVESTING' && kami.production != undefined;

      const isResting = (kami: Kami): boolean => kami.state === 'RESTING';

      const isOutOfWorld = (kami: Kami): boolean => kami.state === '721_EXTERNAL';

      return (
        <ModalWrapper id='bridgeERC721' divName='bridgeERC721' canExit overlay>
          <Title>Stake/Unstake Kamis</Title>
          <Grid>
            <Description style={{ gridRow: 1, gridColumn: 1 }}>In game</Description>
            <Scrollable style={{ gridRow: 2, gridColumn: 1 }}>
              {KamiCards(data.account.kamis)}
            </Scrollable>
            <Description style={{ gridRow: 1, gridColumn: 2 }}>In wallet</Description>
            <Scrollable style={{ gridRow: 2, gridColumn: 2 }}>{KamiCards(EOAKamis)}</Scrollable>
          </Grid>
        </ModalWrapper>
      );
    }
  );
}

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
  font-size: 1.5vw;
  color: black;
  text-align: center;
  padding: 1.5vw;
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
