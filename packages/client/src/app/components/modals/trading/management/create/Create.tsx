import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Dispatch, useEffect, useState } from 'react';

import { calcTradeTax } from 'app/cache/trade';
import { IconButton, Overlay, Pairing, Text } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { ETH_INDEX, ONYX_INDEX } from 'constants/items';
import { Account, Inventory } from 'network/shapes';
import { Item } from 'network/shapes/Item';
import { ActionComponent } from 'network/systems';
import { waitForActionCompletion } from 'network/utils';
import styled from 'styled-components';
import { playClick } from 'utils/sounds';
import { TRADE_ROOM_INDEX } from '../../constants';
import { ConfirmationData } from '../../library';
import { MultiCreate } from './MultiCreate';
import { SingleCreate } from './SingleCreate';

type Mode = 'Single' | 'Multi';
const DisabledItems = [ONYX_INDEX, ETH_INDEX];

export const Create = ({
  actions,
  controls,
  data,
  types,
  utils,
}: {
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
  };
  data: {
    account: Account;
    currencies: Item[];
    inventory: Inventory[];
    items: Item[];
  };
  types: {
    ActionComp: ActionComponent;
  };
  utils: {
    entityToIndex: (id: EntityID) => EntityIndex;
  };
}) => {
  const { createTrade } = actions;
  const { setIsConfirming, setConfirmData } = controls;
  const { account } = data;
  const { ActionComp } = types;
  const { entityToIndex } = utils;

  const [mode, setMode] = useState<Mode>('Single');
  const [thousandsSeparator, setThousandsSeparator] = useState<string>(',');

  // tests number formatting
  useEffect(() => {
    setThousandsSeparator((4.56).toLocaleString().includes(',') ? '.' : ',');
  }, []);

  // toggle between multi and single Create modes
  const toggleMode = () => {};

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
  const handleCreatePrompt = (want: Item[], wantAmt: number[], have: Item[], haveAmt: number[]) => {
    const confirmAction = () => handleTrade(want, wantAmt, have, haveAmt);
    setConfirmData({
      title: 'Confirm Creation',
      content: getCreateConfirmation(want, wantAmt, have, haveAmt),
      onConfirm: confirmAction,
    });
    setIsConfirming(true); // TODO: this is a hack to get the confirmation to show
    playClick();
  };

  /////////////////
  // DISPLAY

  // create the trade confirmation window content
  // TODO: adjust Buy amounts for tax and display breakdown in tooltip
  const getCreateConfirmation = (
    want: Item[],
    wantAmt: number[],
    have: Item[],
    haveAmt: number[]
  ) => {
    const tradeConfig = data.account.config?.trade;
    const createFee = tradeConfig?.fees.creation ?? 0;
    const deliveryFee = tradeConfig?.fees.delivery ?? 0;
    const taxConfig = tradeConfig?.tax;
    const taxRate = taxConfig?.value ?? 0;

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
          {haveAmt.map((amt, i) => (
            <Pairing
              key={i}
              text={amt.toLocaleString()}
              icon={have[i].image}
              tooltip={[`${amt.toLocaleString()} ${have[i].name}`]}
            />
          ))}
          <Text size={1.2}>{`) `}</Text>
          <Text size={1.2}>{`will be transferred to the Trade.`}</Text>
        </Row>
        <Row>
          <Text size={1.2}>{'Upon completion, you will receive'}</Text>
        </Row>
        <Row>
          <Text size={1.2}>{'('}</Text>
          {wantAmt.map((amt, i) => {
            const wantItem = want[i];
            const tax = calcTradeTax(wantItem, amt, taxRate);
            const taxPercent = Math.floor(taxRate * 100).toFixed(2);
            const taxTooltip = [`${amt.toLocaleString()} ${wantItem.name}`];
            if (tax > 0) taxTooltip.push(`less ${taxPercent}% tax (${tax} ${wantItem.name})`);
            return (
              <Pairing
                key={i}
                text={(amt - tax).toLocaleString()}
                icon={want[i].image}
                tooltip={taxTooltip}
              />
            );
          })}
          <Text size={1.2}>{`)`}</Text>
        </Row>
        <Row>
          <Text size={0.9}>{`Listing Fee: (`}</Text>
          <Pairing
            text={createFee.toLocaleString()}
            icon={ItemImages.musu}
            scale={0.9}
            tooltip={[
              `Non-refundable (trade responsibly)`,
              `Deducted from your inventory upon creation.`,
            ]}
          />
          <Text size={0.9}>{`)`}</Text>
        </Row>
        {account.roomIndex !== TRADE_ROOM_INDEX && (
          <Row>
            <Text size={0.9}>{`Delivery Fee: (`}</Text>
            <Pairing
              text={deliveryFee.toLocaleString()}
              icon={ItemImages.musu}
              scale={0.9}
              tooltip={[`Trading outside of designated rooms`, `incurs a flat delivery fee.`]}
            />
            <Text size={0.9}>{`)`}</Text>
          </Row>
        )}
      </Paragraph>
    );
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay top={0} fullWidth>
        <Title>Create Offer</Title>
      </Overlay>
      {/* MultiCreate phased out */}
      <SingleCreate
        actions={{ ...actions, handleCreatePrompt }}
        controls={{ ...controls }}
        data={{
          ...data,
          items: data.items.filter((item) => !DisabledItems.includes(item.index)),
          thousandsSeparator,
        }}
        isVisible={mode === 'Single'}
      />
      {/* Mode toggle phased out */}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
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

const Paragraph = styled.div`
  color: #333;
  flex-grow: 1;
  padding: 1.8vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-evenly;
  align-items: center;
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
