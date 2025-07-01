import { EntityID, EntityIndex } from '@mud-classic/recs';
import { ChangeEvent, Dispatch, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getInventoryBalance } from 'app/cache/inventory';
import { IconButton, IconListButtonOption, Overlay, Pairing, Text } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { MUSU_INDEX } from 'constants/items';
import { Account, Inventory } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { ActionComponent } from 'network/systems';
import { waitForActionCompletion } from 'network/utils';
import { playClick } from 'utils/sounds';
import { ConfirmationData } from '../Confirmation';
import { TRADE_ROOM_INDEX } from '../constants';
import { LineItem } from './LineItem';

interface Props {
  actions: {
    createTrade: (
      wantItems: Item[],
      wantAmts: number[],
      haveItems: Item[],
      haveAmts: number[]
    ) => EntityID | void;
  };
  controls: {
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
    itemSearch: string;
    setItemSearch: Dispatch<string>;
  };
  data: {
    account: Account;
    currencies: Item[];
    items: Item[];
  };
  types: {
    ActionComp: ActionComponent;
  };
  utils: {
    entityToIndex: (id: EntityID) => EntityIndex;
  };
}

export const Create = (props: Props) => {
  const { actions, controls, data, types, utils } = props;
  const { createTrade } = actions;
  const { isConfirming, setIsConfirming, itemSearch, setItemSearch } = controls;
  const { setConfirmData } = controls;
  const { account, items } = data;
  const { ActionComp } = types;
  const { entityToIndex } = utils;
  const { modals } = useVisibility();

  const [want, setWant] = useState<Item[]>([]);
  const [wantAmt, setWantAmt] = useState<number[]>([]);
  const [have, setHave] = useState<Item[]>([]);
  const [haveAmt, setHaveAmt] = useState<number[]>([]);

  useEffect(() => {
    if (modals.trading) reset();
  }, [modals.trading]);

  const reset = () => {
    const musu = items.find((item) => item.index === MUSU_INDEX)!;
    setWant([musu]);
    setWantAmt([1]);
    setHave([musu]);
    setHaveAmt([1]);
  };

  /////////////////
  // HANDLERS

  // organize the form data for trade offer creation
  // TODO: detect successful trade creation and reset form
  const handleTrade = async (want: Item[], wantAmt: number[], have: Item[], haveAmt: number[]) => {
    try {
      const tradeActionID = createTrade(want, wantAmt, have, haveAmt);
      if (!tradeActionID) throw new Error('Trade action failed');
      await waitForActionCompletion(ActionComp, entityToIndex(tradeActionID) as EntityIndex);
    } catch (e) {
      console.log('handleTrade() failed', e);
    }
  };

  // handle prompting for confirmation with trade creation
  const handleCreatePrompt = () => {
    const confirmAction = () => handleTrade(want, wantAmt, have, haveAmt);
    setConfirmData({
      title: 'Confirm Creation',
      content: getConfirmContent(),
      onConfirm: confirmAction,
    });
    setIsConfirming(true); // TODO: this is a hack to get the confirmation to show
    playClick();
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
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const amt = Math.max(min, rawQuantity);

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
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const max = getInventoryBalance(account.inventories ?? [], item.index);
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
        if (!account.inventories) return [];
        const filtered = account.inventories.filter((inv: Inventory) => {
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

  // create the trade confirmation window content
  // TODO: adjust Buy amounts for tax and display breakdown in tooltip
  const getConfirmContent = () => {
    const tradeConfig = account.config?.trade;
    const taxConfig = tradeConfig?.tax;
    const tradeFee = tradeConfig?.fee ?? 0;

    let tax = 0;
    let taxTooltip: string[] = [];
    if (taxConfig) {
      tax = Math.floor(wantAmt[0] * taxConfig.value);
      const taxPercent = Math.floor(taxConfig.value * 100).toFixed(2);
      taxTooltip = [`${wantAmt[0].toLocaleString()} MUSU`, `less ${taxPercent}% tax (${tax} MUSU)`];
    }

    return (
      <Paragraph>
        <Row>
          <Text size={1.2}>{'('}</Text>
          <Pairing
            text={haveAmt[0].toLocaleString()}
            icon={have[0].image}
            tooltip={[`${haveAmt[0].toLocaleString()} ${have[0].name}`]}
          />
          <Text size={1.2}>{`) will be transferred to the Trade.`}</Text>
        </Row>
        <Row>
          <Text size={1.2}>{'You will receive ('}</Text>
          <Pairing
            text={(wantAmt[0] - tax).toLocaleString()}
            icon={want[0].image}
            tooltip={taxTooltip}
          />
          <Text size={1.2}>{`) upon Completion.`}</Text>
        </Row>
        {/* <Row>
          <Text size={0.9}>{`Listing Fee: (`}</Text>
          <Pairing
            text={tradeFee.toLocaleString()}
            icon={currency.image}
            scale={0.9}
            tooltip={[
              `Non-refundable (trade responsibly)`,
              `Deducted from your inventory upon creation.`,
            ]}
          />
          <Text size={0.9}>{`)`}</Text>
        </Row> */}
      </Paragraph>
    );
  };

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
    <Container>
      <Overlay top={0} fullWidth>
        <Title>Create Offer</Title>
      </Overlay>
      <Body>
        <Text size={1.2}>I want</Text>
        {WantSection}
        <Text size={1.2}>for</Text>
        {HaveSection}
      </Body>
      <Overlay bottom={0.75} right={0.75}>
        <IconButton
          text='Create'
          onClick={handleCreatePrompt}
          disabled={
            isConfirming ||
            want.length === 0 ||
            have.length === 0 ||
            account.roomIndex !== TRADE_ROOM_INDEX // dtl check this based on room flags
          }
        />
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-right: 0.15vw solid black;

  width: 40%;
  height: 100%;

  user-select: none;
`;

const Title = styled.div`
  position: sticky;
  background-color: rgb(221, 221, 221);
  opacity: 0.9;

  width: 100%;
  top: 0;
  z-index: 1;
  padding: 1.8vw;

  color: black;
  font-size: 1.2vw;
  text-align: left;
`;

const Body = styled.div`
  position: relative;
  height: 100%;
  padding: 6vw 0.6vw 1.8vw 0.6vw;
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

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;

const Paragraph = styled.div`
  color: #333;
  flex-grow: 1;
  padding: 1.8vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-evenly;
  align-items: center;
`;
