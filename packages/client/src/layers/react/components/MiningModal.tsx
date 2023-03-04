import React, { useState, useEffect } from "react";
import { map, merge } from "rxjs";
import { BigNumber } from "ethers";
import { EntityIndex, Has, HasValue, NotValue, getComponentValue, runQuery } from "@latticexyz/recs";

import { registerUIComponent } from "../engine/store";

// this one is location-specific (assumes at most 1 node per room)
export function registerMiningModal() {
  registerUIComponent(
    "MiningModal",

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
            IsPet,
            IsNode,
            IsOperator,
            IsProduction,
            Location,
            Name,
            NodeID,
            OperatorID,
            PetID,
            PlayerAddress,
            State,
            StartTime,
          },
          actions,
        },
      } = layers;

      // get the production for an operator on a node
      const getMatchingProductionIndex = (operatorIndex: EntityIndex, nodeIndex: EntityIndex) => {
        const petIndices = Array.from(runQuery([
          Has(IsPet),
          HasValue(OperatorID, { value: world.entities[operatorIndex] }),
        ]));

        let petID, results;
        for (let i = 0; i < petIndices.length; i++) {
          petID = world.entities[petIndices[i]];
          results = runQuery([
            Has(IsProduction),
            HasValue(PetID, { value: petID }),
            HasValue(NodeID, { value: world.entities[nodeIndex] }),
          ]);
          if (results.size != 0) return Array.from(results)[0];
        }
        return 0;
      }

      // gets a Node object from an index
      const getNode = (index: EntityIndex) => {
        return {
          id: world.entities[index],
          index,
          location: getComponentValue(Location, index)?.value as number,
          name: getComponentValue(Name, index)?.value as string,
        }
      }
      // gets a Production object from an index
      const getProduction = (index: EntityIndex) => {
        return {
          id: world.entities[index],
          index,
          petID: getComponentValue(PetID, index)?.value as string,
          nodeID: getComponentValue(NodeID, index)?.value as string,
          state: getComponentValue(State, index)?.value as string,
          timeStart: getComponentValue(StartTime, index)?.value as number,
        }
      }

      return merge(OperatorID.update$, Location.update$, StartTime.update$, State.update$).pipe(
        map(() => {
          // get the operator entity of the controlling wallet
          const operatorIndex = Array.from(runQuery([
            Has(IsOperator),
            HasValue(PlayerAddress, { value: network.connectedAddress.get() })
          ]))[0];
          const operatorID = world.entities[operatorIndex];

          // get player location and list of nodes in this room
          const location = getComponentValue(Location, operatorIndex)?.value as number;
          const nodeResults = runQuery([
            Has(IsNode),
            HasValue(Location, { value: location }),
          ]);

          let node, nodeIndex, production;
          if (nodeResults.size != 0) {
            nodeIndex = Array.from(nodeResults)[0];
            node = getNode(nodeIndex);

            const productionIndex = getMatchingProductionIndex(operatorIndex, nodeIndex);
            if (productionIndex != 0) {
              production = getProduction(productionIndex);
            }
          }

          return {
            world,
            actions,
            api: player,
            data: {
              operator: {
                id: operatorID,
              },
              node,
              production,
            } as any,
          };
        })
      );
    },

    // Render
    ({ world, actions, api, data }) => {
      // Actions to support on each request:
      // accept trade
      // cancel trade
      return (<div></div>);
    }
  );
}