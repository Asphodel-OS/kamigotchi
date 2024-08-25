import { EntityID } from '@mud-classic/recs';
import pluralize from 'pluralize';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { craftIcon } from 'assets/images/icons/actions';
import { getStamina, queryAccountFromBurner } from 'network/shapes/Account';
import { getItemBalance } from 'network/shapes/Item';
import { getNPCByIndex } from 'network/shapes/NPCs';
import { Ingredient, Recipe, getRecipesByAssigner } from 'network/shapes/Recipe';
import styled from 'styled-components';
import { Kard } from './components/Kard';

export function registerCraftingModal() {
  registerUIComponent(
    'CraftingModal',

    // Grid Config
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 25,
      rowEnd: 85,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;

          const accountEntity = queryAccountFromBurner(network);
          const stamina = getStamina(world, components, accountEntity).sync;

          return {
            network,
            data: {
              stamina: stamina,
            },
            utils: {
              getItemBalance: (index: number) =>
                getItemBalance(world, components, world.entities[accountEntity], index),
            },
            assignerID: getNPCByIndex(world, components, 1).id, // temp placeholder
          };
        })
      ),

    // Render
    ({ data, network, utils, assignerID }) => {
      const { actions, api, components, world } = network;
      // const { assignerID } = useSelected();
      const [recipes, setRecipes] = useState<Recipe[]>([]);

      // updates from selected Node updates
      useEffect(() => {
        setRecipes(getRecipesByAssigner(world, components, assignerID as EntityID));
      }, [assignerID]);

      /////////////////
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
          header={[<ModalHeader title='Crafting' icon={craftIcon} />]}
          canExit
        >
          <Content>
            {recipes.length > 0 ? (
              recipes.map((recipe: Recipe) => (
                <Kard
                  key={`recipe-${recipe.index}`}
                  recipe={recipe}
                  data={data}
                  actions={{ craft: craft }}
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
  justify-content: center;

  gap: 0.6vw;

  width: 100%;
  max-hight: 95%;
  overflow-y: scroll;
`;
