import { useEffect, useMemo, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper, Overlay } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { hoverFx } from 'app/styles/effects';
import { ItemImages } from 'assets/images/items';
import { OBOL_INDEX } from 'constants/items';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getItemBalance } from 'network/shapes/Item';
import { checkActionState } from 'network/utils';

const obolsPerEgg = 5;
const arrowButtons = [
  { label: '+5', value: 5, symbol: '\u25B2' },
  { label: '+1', value: 1, symbol: '\u25B4', smaller: true, marginLeft: '0.6vw' },
  { label: '-1', value: -1, symbol: '\u25BE', smaller: true, marginLeft: '0.7vw' },
  { label: '-5', value: -5, symbol: '\u25BC' },
];

export const ObolModal: UIComponent = {
  id: 'ObolModal',
  requirement: (layers) => {
    return interval(1000).pipe(
      map(() => {
        const { network } = layers;
        const { world, components } = network;
        const accountEntity = queryAccountFromEmbedded(network);
        const account = world.entities[accountEntity];

        return {
          network,
          utils: {
            getObolsBalance: () => getItemBalance(world, components, account, OBOL_INDEX),
          },
        };
      })
    );
  },
  Render: ({ network, utils }) => {
    const { actions, api } = network;
    const { getObolsBalance } = utils;

    const { modals, setModals } = useVisibility();
    const [eggsQuantity, setEggsQuantity] = useState(1);
    const [isDisabled, setIsDisabled] = useState(false);

    /////////////////
    useEffect(() => {
      if (!modals.lootBox) return;
      // reset eggsQuantity on modal close
      setEggsQuantity(1);
      // close crafting modal
      setModals({ crafting: false });
    }, [modals.lootBox]);

    /////////////////
    // HELPERS

    const onEggClick = async (quantity: number) => {
      const newQty = Math.max(1, eggsQuantity + quantity);
      // wont allow the player to exceed the balance
      if (newQty * obolsPerEgg <= getObolsBalance()) setEggsQuantity(newQty);
    };

    /////////////////
    // ACTIONS

    const craft = async (index: number, amount: number) => {
      setIsDisabled(true);
      const transaction = actions.add({
        action: 'Craft',
        params: [index, amount],
        description: `Crafting ${amount} Wonder ${amount > 1 ? 'Eggs' : 'Egg'}`,
        execute: async () => {
          return api.player.account.item.craft(index, amount);
        },
      });
      const completed = await checkActionState(actions.Action, transaction);
      if (completed) {
        setEggsQuantity(1);
      }
      setIsDisabled(false);
    };

    /////////////////
    // RENDERING
    const HeaderRenderer = (
      <Header>
        <HeaderRow>
          <HeaderPart size={1}>EVERYTHING MUST GO!!!</HeaderPart>
          <HeaderPart size={1.2}> "Normal!" - Leonard</HeaderPart>
        </HeaderRow>
        <HeaderPart size={2.8} weight={'bolder'} spacing={-0.4}>
          Pop-Up Shop
        </HeaderPart>
        <HeaderRow>
          <HeaderPart size={1.2}>"Five stars!!" - Amy</HeaderPart>
          <HeaderPart size={1}>WE ACCEPT OBOLS</HeaderPart>
        </HeaderRow>
      </Header>
    );

    const FooterRenderer = useMemo(() => {
      return (
        <Footer>
          <img src={ItemImages.obol} style={{ width: `2vw` }} />
          <Balance>{getObolsBalance()}</Balance>
        </Footer>
      );
    }, [getObolsBalance]);

    return (
      <ModalWrapper
        id='lootBox'
        header={HeaderRenderer}
        footer={FooterRenderer}
        noPadding
        overlay
        truncate
      >
        <Content>
          <Overlay top={4} left={5} gap={0.3} orientation='column' align='flex-end'>
            {arrowButtons.map(({ label, value, symbol, smaller, marginLeft }) => (
              <Row onClick={() => onEggClick(value)} key={label}>
                <Arrow smaller={smaller}>{symbol}</Arrow>
                <Number marginLeft={marginLeft}>{label}</Number>
              </Row>
            ))}
          </Overlay>
          <Text>Wonder Egg</Text>
          <Img src={ItemImages.wonder_egg} />
          <Overlay top={6} right={6} orientation='column'>
            <Text size={1.7} weight={`bold`}>
              X{eggsQuantity}
            </Text>
          </Overlay>
          <Text> {eggsQuantity * obolsPerEgg} Obols</Text>
          <ButtonsRow>
            <Button
              disabled={isDisabled || eggsQuantity * obolsPerEgg > getObolsBalance()}
              onClick={() => {
                craft(10001, eggsQuantity);
              }}
            >
              I accept.
            </Button>
            <Button
              onClick={() => {
                setModals({ lootBox: false });
              }}
            >
              I refuse.
            </Button>
          </ButtonsRow>
        </Content>
      </ModalWrapper>
    );
  },
};

const Content = styled.div`
  position: relative;
  gap: 0.6vw;
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  overflow: hidden auto;
  background-color: black;
  color: white;
  border: 0.3vw solid white;
  align-items: center;
  padding: 2vw;
  font-size: 1vw;
  padding-bottom: 0.5vw;
`;

const Header = styled.div`
  position: relative;
  background-color: black;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
  gap: 0.5vw;
  padding: 1vw;
  padding-bottom: 0;
  flex-direction: column;
  line-height: 1vw;
  border: 0.3vw solid white;
  border-bottom: none;
  border-radius: 1vw 1vw 0 0;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  width: 100%;
`;

const HeaderPart = styled.div<{ size: number; weight?: string; spacing?: number }>`
  position: relative;
  color: white;
  padding: 0.5vw;
  letter-spacing: ${({ spacing }) => spacing || -0.25}vw;
  font-size: ${({ size }) => size}vw;
  font-weight: ${({ weight }) => weight || 'normal'};
`;

const Footer = styled.div`
  display: flex;
  position: relative;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.3vw;
  background-color: black;
  color: white;
  border: 0.3vw solid white;
  border-top: none;
  border-radius: 0 0 1vw 1vw;
  height: 4vw;
  width: 100%;
  padding-right: 0.5vw;
`;

const ButtonsRow = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5vw;
  padding: 0.5vw;
`;

// modify icontbutton so it
//  has color and bakcground color
const Button = styled.button`
  border: 0.2vw solid white;
  background-color: black;
  color: white;
  padding: 0.5vw;
  font-size: 1vw;
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
    cursor: pointer;
  }
`;

const Img = styled.img`
  width: 5vw;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  padding: 0.5vw;
`;

const Text = styled.span<{ size?: number; weight?: string }>`
  color: white;
  ${({ size }) => (size ? `font-size: ${size}vw;` : '0.8vw;')}
  ${({ weight }) => (weight ? `font-weight: ${weight};` : 'normal;')}
`;

const Balance = styled.div`
  border: solid white 0.3vw;
  border-radius: 0.6vw 0 0.6vw 0.6vw;
  padding: 0.3vw;
  width: 30%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;

  color: white;
  font-size: 0.9vw;
  line-height: 1.2vw;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: white;
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
    color: red;
    cursor: pointer;
  }
`;

const Arrow = styled.div<{ smaller?: boolean }>`
  color: currentColor;
  font-size: ${({ smaller }) => (smaller ? '0.7vw' : '0.8vw')};
`;

const Number = styled.div<{ marginLeft?: string }>`
  color: currentColor;
  font-size: 0.8vw;
  margin-left: ${({ marginLeft }) => marginLeft ?? '0.4'}vw;
`;
