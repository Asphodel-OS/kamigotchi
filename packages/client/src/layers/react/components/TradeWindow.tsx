import React, { useState, useEffect } from "react";
import { map, merge } from "rxjs";
import { BigNumber } from "ethers";
import { EntityIndex, Has, HasValue, NotValue, getComponentValue, runQuery, } from "@latticexyz/recs";

import { registerUIComponent } from "../engine/store";

// NOTE(ja): potentially may want to split this up into two components (main window + registers)
export function registerTradeWindow() {
  registerUIComponent(
    "TradeWindow",

    // Grid Config
    {
      colStart: 0,
      colEnd: 0,
      rowStart: 0,
      rowEnd: 0,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          world,
          api: { player },
          network,
          components: {
            Balance,
            Coin,
            DelegateeID,
            DelegatorID,
            HolderID,
            IsInventory,
            IsOperator,
            IsRegister,
            IsTrade,
            ItemIndex,
            OperatorID,
            PlayerAddress,
            RequesterID,
            RequesteeID,
            State
          },
          actions,
        },
      } = layers;

      // only grabs the first one we find. we should restrict trades to one per active
      const getActiveTradeIndex = (operatorIndex: EntityIndex) => {
        let index = 0;
        // get the active trades for this player on the requestee side
        const activeRequesteeTrades = runQuery([
          Has(IsTrade),
          HasValue(RequesteeID, { value: world.entities[operatorIndex] }),
          HasValue(State, { value: "ACCEPTED" }),
        ]);

        // get the active trades for this player on the requester side
        const activeRequesterTrades = runQuery([
          Has(IsTrade),
          HasValue(RequesterID, { value: world.entities[operatorIndex] }),
          HasValue(State, { value: "ACCEPTED" }),
        ]);

        const activeTrades = new Set([...activeRequesteeTrades, ...activeRequesterTrades]);
        if (activeTrades.size > 0) {
          index = Array.from(activeTrades)[0];
        }
        return index;
      }

      // gets the contents of a register by index
      const getRegister = (index: EntityIndex) => {
        const id = world.entities[index];

        const inventoryIndices = Array.from(runQuery([
          Has(IsInventory),
          HasValue(HolderID, { value: world.entities[index] }),
        ]));

        // reorganize inventory into lists
        let itemTypes: number[] = [], itemType: number;
        let balances: number[] = [], balance: number;
        for (let i = 0; i < inventoryIndices.length; i++) {
          itemType = getComponentValue(ItemIndex, inventoryIndices[i])?.value as number;
          balance = getComponentValue(Balance, inventoryIndices[i])?.value as number;
          itemTypes.push(itemType);
          balances.push(balance);
        }

        return {
          id,
          index,
          items: {
            itemTypes,
            balances,
          },
          coin: getComponentValue(Coin, index)?.value as Number, // this might not be set. would it fail?
        }
      }

      // NOTE: we really want precise data subscriptions for this one, a nightmare without
      return merge(OperatorID.update$, State.update$, DelegateeID.update$, IsInventory.update$).pipe(
        map(() => {
          // get the operator entity of the controlling wallet
          const operatorIndex = Array.from(runQuery([
            Has(IsOperator),
            HasValue(PlayerAddress, { value: network.connectedAddress.get() })
          ]))[0];
          const operatorID = world.entities[operatorIndex];

          const tradeIndex = getActiveTradeIndex(operatorIndex);
          let myRegisterIndex, myRegister;
          let yourRegisterIndex, yourRegister;

          // get the register indices. at this point we can guarantee they exist for the trade
          if (tradeIndex != 0) {
            myRegisterIndex = Array.from(runQuery([
              Has(IsRegister),
              HasValue(DelegateeID, { value: world.entities[tradeIndex] }),
              HasValue(DelegatorID, { value: world.entities[operatorIndex] }),
              HasValue(State, { value: "ACTIVE" }), // this filter not actually necessary
            ]))[0] as EntityIndex;
            yourRegisterIndex = Array.from(runQuery([
              Has(IsRegister),
              HasValue(DelegateeID, { value: world.entities[tradeIndex] }),
              NotValue(DelegatorID, { value: world.entities[operatorIndex] }),
              HasValue(State, { value: "ACTIVE" }), // this filter not actually necessary
            ]))[0] as EntityIndex;
            myRegister = getRegister(myRegisterIndex);
            yourRegister = getRegister(yourRegisterIndex);
          }

          return {
            world,
            actions,
            api: player,
            data: {
              operator: {
                id: operatorID,
              },
              trade: {
                id: world.entities[tradeIndex],
                registers: {
                  mine: myRegister,
                  yours: yourRegister,
                }
              },
            } as any,
          };
        })
      );
    },

    // Render
    ({ world, actions, api, data }) => {
      // hide this component if trade.index == 0

      // Actions to support within trade window:
      // AddToTrade (ideally drag and drop in the future)
      // CancelTrade
      // ConfirmTrade
      return (<div></div>);
    }
  );
}