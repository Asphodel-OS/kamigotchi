import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getInventoryBalance } from 'app/cache/inventory';
import { IconButton, IconListButtonOption, Overlay, Text } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { MUSU_INDEX } from 'constants/items';
import { Inventory } from 'network/shapes';
import { Item, NullItem } from 'network/shapes/Item';
import { LineItem } from './LineItem';

// a GUI for creating Generalized Trade Offers
export const MultiCreate = ({
  actions,
  controls,
  data,
  isVisible,
}: {
  actions: {
    handleCreatePrompt: (want: Item[], wantAmt: number[], have: Item[], haveAmt: number[]) => void;
  };
  controls: {
    isConfirming: boolean;
  };
  data: {
    currencies: Item[];
    inventory: Inventory[];
    items: Item[];
  };
  isVisible: boolean;
}) => {
  const { handleCreatePrompt } = actions;
  const { isConfirming } = controls;
  const { inventory, items } = data;
  const { modals } = useVisibility();

  const [want, setWant] = useState<Item[]>([]);
  const [wantAmt, setWantAmt] = useState<number[]>([]);
  const [have, setHave] = useState<Item[]>([]);
  const [haveAmt, setHaveAmt] = useState<number[]>([]);
  const [thousandsSeparator, setThousandsSeparator] = useState<string>(',');

  // tests number formatting
  // TODO: make this available globally through a util function
  useEffect(() => {
    setThousandsSeparator((4.56).toLocaleString().includes(',') ? '.' : ',');
  }, []);

  useEffect(() => {
    reset();
  }, [items.length]);

  const reset = () => {
    const fillerItem = items.find((item) => item.index === MUSU_INDEX) ?? NullItem;
    setWant([fillerItem]);
    setWantAmt([1]);
    setHave([fillerItem]);
    setHaveAmt([1]);
  };

  /////////////////
  // INTERACTION

  // add an item to the list of Wants (BuyOrder Items)
  const addWant = () => {
    const lastItem = want[want.length - 1];
    const lastAmt = wantAmt[wantAmt.length - 1];
    setWant((prev) => [...prev, lastItem]);
    setWantAmt((prev) => [...prev, lastAmt]);
  };

  // delete an Item from the list of Wants (BuyOrder Items)
  const deleteWant = (index: number) => {
    if (want.length === 1) return;

    setWant((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setWantAmt((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  // adjust and clean the Want amounts in the trade offer in respoonse to a form change
  const updateWantAmt = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const min = 0;
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(thousandsSeparator, '') || '0');
    const max = Number.MAX_SAFE_INTEGER;
    const amt = Math.max(min, Math.min(max, rawQuantity));

    setWantAmt((prev) => {
      const next = [...prev];
      next[index] = amt;
      return next;
    });
  };

  // add an Item to the list of Haves (SellOrder Items)
  const addHave = () => {
    const lastItem = have[have.length - 1];
    const lastAmt = haveAmt[haveAmt.length - 1];
    setHave((prev) => [...prev, lastItem]);
    setHaveAmt((prev) => [...prev, lastAmt]);
  };

  // delete an Item from the list of Haves (SellOrder Items)
  const deleteHave = (index: number) => {
    if (have.length === 1) return;

    setHave((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setHaveAmt((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  // adjust and clean the Have amounts in the trade offer in respoonse to a form change
  const updateHaveAmt = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const item = have[index];
    const min = 0;
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(thousandsSeparator, '') || '0');
    const max = getInventoryBalance(inventory, item.index);
    const amt = Math.max(min, Math.min(max, rawQuantity));

    setHaveAmt((prev) => {
      const next = [...prev];
      next[index] = amt;
      return next;
    });
  };

  /////////////////
  // INTERPRETATION

  /**
   * @notice get the options for what a player could request in a trade
   * @param index the index of the selected item in the want state array
   */
  const getWantOptions = useMemo(
    () =>
      (index: number): IconListButtonOption[] => {
        const filtered = items.filter((item) => {
          const unused = want.every((wantItem) => wantItem.index !== item.index);
          return unused;
        });

        return filtered.map((item: Item) => {
          return {
            text: item.name,
            image: item.image,
            onClick: () => {
              setWant((prev) => {
                const next = [...prev];
                next[index] = item;
                return next;
              });
              setWantAmt((prev) => {
                const next = [...prev];
                next[index] = 1;
                return next;
              });
            },
          };
        });
      },
    [want]
  );

  /**
   * @notice get the options for what a player could offer in a trade
   * @param index the index of the selected item in the have state array
   */
  const getHaveOptions = useMemo(
    () =>
      (index: number): IconListButtonOption[] => {
        const filtered = inventory.filter((inv: Inventory) => {
          if (!inv || !inv.item) return false;
          const isTradeable = inv.item.is.tradeable;
          const hasBalance = inv.balance > 0;
          const unused = have.every((item) => item.index !== inv.item.index);
          return isTradeable && hasBalance && unused;
        });

        return filtered.map((inv: Inventory) => {
          return {
            text: inv.item.name,
            image: inv.item.image,
            onClick: () => {
              setHave((prev) => {
                const next = [...prev];
                next[index] = inv.item;
                return next;
              });
              setHaveAmt((prev) => {
                const next = [...prev];
                next[index] = 1;
                return next;
              });
            },
          };
        });
      },
    [have]
  );

  /////////////////
  // DISPLAY

  // memoized Want-side order creation
  const WantSection = useMemo(
    () => (
      <Section>
        {want.map((_, i) => (
          <LineItem
            key={i}
            options={getWantOptions(i)}
            selected={want[i]}
            amt={wantAmt[i]}
            setAmt={(e) => updateWantAmt(i, e)}
            remove={() => deleteWant(i)}
          />
        ))}
        <Row>
          <IconButton text='+' onClick={addWant} width={2.4} />
        </Row>
      </Section>
    ),
    [want, wantAmt]
  );

  // memoized Have-side order creation
  const HaveSection = useMemo(
    () => (
      <Section>
        {have.map((_, i) => (
          <LineItem
            key={i}
            options={getHaveOptions(i)}
            selected={have[i]}
            amt={haveAmt[i]}
            setAmt={(e) => updateHaveAmt(i, e)}
            remove={() => deleteHave(i)}
          />
        ))}
        <Row>
          <IconButton text='+' onClick={addHave} width={2.4} />
        </Row>
      </Section>
    ),
    [have, haveAmt]
  );

  /////////////////
  // RENDER

  return (
    <Container isVisible={isVisible}>
      <Body>
        <Text size={1.2}>I want</Text>
        {want.length > 0 && WantSection}
        <Text size={1.2}>for</Text>
        {have.length > 0 && HaveSection}
      </Body>
      <Overlay bottom={0.75} right={0.75}>
        <IconButton
          text='Create'
          onClick={() => handleCreatePrompt(want, wantAmt, have, haveAmt)}
          disabled={isConfirming || want.length === 0 || have.length === 0}
        />
      </Overlay>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  position: relative;
  width: 100%;
  height: 100%;
`;

const Body = styled.div`
  position: relative;
  height: 100%;
  padding: 6vw 0.6vw 0.6vw 0.6vw;
  gap: 1.2vw;

  display: flex;
  flex-direction: column;
  align-items: center;

  overflow-y: scroll;
  scrollbar-color: transparent transparent;
`;

const Section = styled.div`
  background-color: rgb(221, 221, 221);
  border-radius: 0.6vw;
  border: 0.15vw solid black;
  padding: 0.6vw;
  gap: 0.6vw;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const Row = styled.div`
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;
