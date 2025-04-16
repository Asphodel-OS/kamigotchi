import { BigNumberish } from 'ethers';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getConfigAddress } from 'app/cache/config';
import { getKami } from 'app/cache/kami';
import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork } from 'app/stores';
import { useERC721Balance } from 'network/chain';
import { getAccountFromEmbedded } from 'network/shapes/Account';
import { Kami, queryKamiByIndex } from 'network/shapes/Kami';
import { useWatchBlockNumber } from 'wagmi';

export function registerERC721BridgeModal() {
  registerUIComponent(
    'ERC721Bridge',
    {
      colStart: 22,
      colEnd: 80,
      rowStart: 15,
      rowEnd: 85,
    },
    (layers) => {
      const { network } = layers;
      const { world, components } = network;

      return interval(1000).pipe(
        map(() => {
          return {
            network,
            data: {
              erc721: getConfigAddress(world, components, 'KAMI721_ADDRESS'),
              account: getAccountFromEmbedded(network, { kamis: true }), // todo: change this to cache
            },
          };
        })
      );
    },
    ({ data, network }) => {
      const { erc721, account } = data;
      const { actions, components, world } = network;

      const { selectedAddress, apis } = useNetwork();

      const [EOAKamis, setEOAKamis] = useState<Kami[]>([]);

      /////////////////
      // DATA

      useWatchBlockNumber({
        onBlockNumber: (n) => {
          refetch();
        },
      });

      const { refetch, tokenIndices } = useERC721Balance(account.ownerAddress, erc721);

      // update list of externally owned kamis
      useEffect(() => {
        const getEOAKamis = (): Kami[] => {
          const entities =
            tokenIndices?.map((index: number) => queryKamiByIndex(world, components, index)) || [];
          return entities.map((entity) => getKami(world, components, entity!, { live: 1 }));
        };

        setEOAKamis(getEOAKamis());
      }, [data]);

      /////////////////
      // TRANSACTIONS

      // TODO: pets without accounts are linked to EOA, no account. link EOA
      const depositTx = (tokenID: BigNumberish) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        actions.add({
          action: 'KamiDeposit',
          params: [tokenID],
          description: `Staking Kami ${tokenID}`,
          execute: async () => {
            return api.bridge.ERC721.deposit(tokenID);
          },
        });
      };

      const withdrawTx = (tokenID: BigNumberish) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        actions.add({
          action: 'KamiWithdraw',
          params: [tokenID],
          description: `Unstaking Kami ${tokenID}`,
          execute: async () => {
            return api.bridge.ERC721.withdraw(tokenID);
          },
        });
      };

      //////////////////
      // MODAL LOGIC

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

      const KamiCards = (kamis: Kami[]) => {
        return kamis?.map((kami) => {
          return <KamiCard kami={kami} key={kami.index} image={kami.image} title={kami.name} />;
        });
      };

      /////////////////
      // KAMI LOGIC

      const isImportable = (kami: Kami): boolean => {
        return isOutOfWorld(kami);
      };

      const isExportable = (kami: Kami): boolean => {
        return isResting(kami);
      };

      // naive check right now, needs to be updated with murder check as well
      const isDead = (kami: Kami): boolean => kami.state === 'DEAD';
      const isHarvesting = (kami: Kami): boolean =>
        kami.state === 'HARVESTING' && kami.harvest != undefined;
      const isResting = (kami: Kami): boolean => kami.state === 'RESTING';
      const isOutOfWorld = (kami: Kami): boolean => kami.state === '721_EXTERNAL';

      return (
        <ModalWrapper id='bridgeERC721' canExit>
          <Title>Stake/Unstake Kamis</Title>
          <Grid>
            <Description style={{ gridRow: 1, gridColumn: 1 }}>In game</Description>
            <Scrollable style={{ gridRow: 2, gridColumn: 1 }}>
              {KamiCards(account.kamis || [])}
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
