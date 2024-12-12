import pluralize from 'pluralize';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { craftIcon } from 'assets/images/icons/actions';
import { getAccountFromBurner, getStamina, queryAccountFromBurner } from 'network/shapes/Account';
import { parseConditionalText, passesConditions } from 'network/shapes/Conditional';
import { getItemBalance } from 'network/shapes/Item';
import { getAllRecipes, haveIngredients, Ingredient, Recipe } from 'network/shapes/Recipe';
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

          const account = getAccountFromBurner(network); // sorry: this is not great practice, was stuffed in

          const accountEntityIndex = queryAccountFromBurner(network);
          const stamina = getStamina(world, components, accountEntityIndex).sync;

          return {
            network,
            accountEntityIndex,
            data: {
              stamina: stamina,
            },
            utils: {
              meetsRequirements: (recipe: Recipe) =>
                passesConditions(world, components, recipe.requirements, account),
              displayRequirements: (recipe: Recipe) =>
                recipe.requirements
                  .map((req) => parseConditionalText(world, components, req))
                  .join(', '),
              getItemBalance: (index: number) =>
                getItemBalance(world, components, world.entities[accountEntityIndex], index),
              haveIngredients: (recipe: Recipe) =>
                haveIngredients(world, components, recipe, world.entities[accountEntityIndex]),
            },
          };
        })
      ),

    // Render
    ({ data, network, utils }) => {
      const { actions, api, components, world } = network;
      const [recipes, setRecipes] = useState<Recipe[]>([]);
      const [filter, setFilter] = useState<boolean>(false);

      // updates from selected Node updates
      useEffect(() => {
        const recipes = getAllRecipes(world, components);
        if (filter === false) {
          setRecipes(recipes);
        } else {
          const available: Recipe[] = [];
          const notAvailable: Recipe[] = [];
          recipes.map((recipe) => {
            if (utils.haveIngredients(recipe)) {
              available.push(recipe);
            } else {
              notAvailable.push(recipe);
            }
          });
          setRecipes(available.concat(notAvailable));
        }
      }, [filter]);

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
            return api.player.crafting.craft(0, recipe.index, amount);
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
