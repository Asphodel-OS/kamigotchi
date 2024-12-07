import { EntityID } from '@mud-classic/recs';
import pluralize from 'pluralize';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { craftIcon } from 'assets/images/icons/actions';
import { getStamina, queryAccountFromBurner } from 'network/shapes/Account';
import { getItemBalance, Inventory, queryInventories } from 'network/shapes/Item';
import { getNPCByIndex } from 'network/shapes/NPCs';
import { getRecipesByAssigner, Ingredient, Recipe } from 'network/shapes/Recipe';
import styled from 'styled-components';
import { Kard } from './components/Kard';

export function registerCraftingModal() {
  registerUIComponent(
    'CraftingModal',

    // Grid Config
    {
      colStart: 35,
      colEnd: 80,
      rowStart: 15,
      rowEnd: 85,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntityIndex = queryAccountFromBurner(network);
          const stamina = getStamina(world, components, accountEntityIndex).sync;

          return {
            network,
            accountEntityIndex,
            data: {
              stamina: stamina,
            },
            utils: {
              getItemBalance: (index: number) =>
                getItemBalance(world, components, world.entities[accountEntityIndex], index),
            },
            assignerID: getNPCByIndex(world, components, 1)?.id || '0x00', // temp placeholder
          };
        })
      ),

    // Render
    ({ data, network, utils, assignerID, accountEntityIndex }) => {
      const { actions, api, components, world } = network;
      // const { assignerID } = useSelected();
      const [recipes, setRecipes] = useState<Recipe[]>([]);
      const [filter, setFilter] = useState<boolean>(false);

      let checkIngredients = (inventory: Inventory[], recipe: Ingredient[]) => {
        const itemsIndex = inventory.map((inventoryItem) => Number(inventoryItem.entityIndex));
        return recipe.every((ingredient) => itemsIndex.includes(ingredient.index));
      };

      // updates from selected Node updates
      useEffect(() => {
        const recipes = getRecipesByAssigner(world, components, assignerID as EntityID);
        if (filter === false) {
          setRecipes(recipes);
        } else {
          const available: Recipe[] = [];
          const notAvailable: Recipe[] = [];
          getRecipesByAssigner(world, components, assignerID as EntityID).map((recipe) => {
            if (
              checkIngredients(
                queryInventories(world, components, {
                  owner: world.entities[accountEntityIndex],
                }),
                recipe.inputs
              ) === true
            ) {
              available.push(recipe);
            } else {
              notAvailable.push(recipe);
            }
          });
          setRecipes(available.concat(notAvailable));
        }
      }, [assignerID, filter]);

      //////////////////////////////////
      // INTERPRETATION

      const getIngredientsText = (ingredients: Ingredient[], multiplier: number) => {
        let text = '';
        ingredients.forEach((ingredient) => {
          const amount = ingredient.amount * multiplier;
          text += pluralize(ingredient.item.name, amount, true) + ' ';
        });
        return text;
      };

      /////////////////
      // ACTIONS

      const craft = (recipe: Recipe, amount: number) => {
        actions.add({
          action: 'Craft',
          params: [recipe.id, amount],
          description: `Crafting ${getIngredientsText(recipe.outputs, amount)}`,
          execute: async () => {
            return api.player.crafting.craft(assignerID, recipe.index, amount);
          },
        });
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='crafting'
          header={<ModalHeader title='Crafting' icon={craftIcon} />}
          canExit
          width='min-content'
        >
          <Content>
            <button
              style={{ padding: '0.5vw' }}
              onClick={() => {
                setFilter(!filter);
              }}
            >
              Order by Availability
            </button>
            {recipes.length > 0 ? (
              recipes.map((recipe: Recipe) => (
                <Kard
                  key={`recipe-${recipe.index}`}
                  recipe={recipe}
                  data={data}
                  actions={{ craft }}
                  utils={utils}
                />
              ))
            ) : (
              <EmptyText text={['There are no recipes here.', 'Look somewhere else!']} size={1} />
            )}
          </Content>
        </ModalWrapper>
      );
    }
  );
}

const Content = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;

  gap: 0.6vw;

  width: 100%;
  max-hight: 95%;
  padding: 0.5vw;
`;
