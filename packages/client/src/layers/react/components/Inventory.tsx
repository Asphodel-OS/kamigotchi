import React from 'react';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { EntityIndex, Has, HasValue, NotValue, getComponentValue, runQuery } from "@latticexyz/recs";
import { registerUIComponent } from '../engine/store';
import './font.css';
import pompom from '../../../public/img/pompom.png'
import gakki from '../../../public/img/gakki.png'
import ribbon from '../../../public/img/ribbon.png'
import gum from '../../../public/img/gum.png'

export function registerInventory() {
  registerUIComponent(
    'Inventory',
    {
      colStart: 34,
      colEnd: 64,
      rowStart: 5,
      rowEnd: 25,
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
            HolderID,
            IsInventory,
            IsAccount,
            ItemIndex,
            AccountID,
            OperatorAddress,
          },
          actions,
        },
      } = layers;

      // get a Inventory object by index
      // TODO: get name and decription here once we have item registry support
      const getInventory = (index: EntityIndex) => {
        const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
        return {
          id: world.entities[index],
          index,
          item: {
            index: itemIndex, // this is the solecs index rather than the cached index
            // name: getComponentValue(Name, itemIndex)?.value as string,
            // description: ???, // are we intending to save this onchain or on FE?
          },
          balance: getComponentValue(Balance, index)?.value as number,
        }
      }

      return merge(AccountID.update$, Balance.update$).pipe(
        map(() => {
          // get the account entity of the controlling wallet
          const accountIndex = Array.from(runQuery([
            Has(IsAccount),
            HasValue(OperatorAddress, { value: network.connectedAddress.get() })
          ]))[0];
          const accountID = world.entities[accountIndex];

          // get the list of inventory indices for this account
          const inventoryResults = runQuery([
            Has(IsInventory),
            HasValue(HolderID, { value: accountID }),
            NotValue(Balance, { value: 0 }),
          ]);

          // if we have inventories for the account, generate a list of inventory objects
          let inventories: any = [];
          let inventory, inventoryIndex;
          if (inventoryResults.size != 0) {
            inventoryIndex = Array.from(inventoryResults)[0];
            inventory = getInventory(inventoryIndex);
            inventories.push(inventory);
          }

          return {
            world,
            actions,
            api: player,
            data: {
              account: {
                id: accountID,
                inventories,
                coin: getComponentValue(Coin, accountIndex)?.value as number,
              },
            } as any,
          };
        })
      );
    },

    // RENDER
    ({ world, actions, api, data }) => {
      const hideModal = () => {
        const modalId = window.document.getElementById('inventory_modal');
        if (modalId) modalId.style.display = 'none';
      };

      return (
        <ModalWrapper id="inventory_modal">
          <ModalContent>

            <TypeHeading>Equipment</TypeHeading>
            <div style={{ textAlign: 'right' }}>
              <Button
                style={{ pointerEvents: 'auto' }}
                onClick={hideModal}
              >
                Close
              </Button>
            </div>
          </ModalContent>
        </ModalWrapper>
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


const ConsumableGrid = styled.div`
  display: grid;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const CellGrid = styled.div`
  display: grid;
  border-style: solid;
  border-width: 0px;
  border-color: black;
`;


const CellOne = styled.div`
  grid-column: 1;
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const CellTwo = styled.div`
  grid-column: 2;
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const CellThree = styled.div`
  grid-column: 3;
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const CellFour = styled.div`
  grid-column: 4;
`;

const Icon = styled.img`
  grid-column: 1;
  height: 40px;
  padding: 5px;
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
`;

const ModalWrapper = styled.div`
  display: none;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 18px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const TypeHeading = styled.p`
  font-size: 20px;
  color: #333;
  text-align: left;
  padding: 20px;
  font-family: Pixel;
`;

const ItemNumber = styled.p`
  font-size: 24px;
  color: #333;
  font-family: Pixel;
  grid-column: 2;
  padding: 5px
`;
