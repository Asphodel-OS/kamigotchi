import pluralize from 'pluralize';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccount } from 'app/cache/account';
import { getAllRecipes } from 'app/cache/recipes';
import { ActionButton, EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { CraftIcon } from 'assets/images/icons/actions';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { parseConditionalText, passesConditions } from 'network/shapes/Conditional';
import { getItemBalance } from 'network/shapes/Item';
import { hasIngredients, Ingredient, Recipe } from 'network/shapes/Recipe';
import { Recipes } from './Recipes/Recipes';
import { Tabs } from './tabs/Tabs';

export const CraftingModal: UIComponent = {
  id: 'CraftingModal',
  requirement: (layers) =>
    interval(1000).pipe(
      map(() => {
        const { network } = layers;
        const { world, components } = network;

        const accountEntity = queryAccountFromEmbedded(network);
        const account = getAccount(world, components, accountEntity, { live: 2, config: 3600 });

        return {
          network,
          data: { account },
          utils: {
            meetsRequirements: (recipe: Recipe) =>
              passesConditions(world, components, recipe.requirements, account),
            displayRequirements: (recipe: Recipe) =>
              recipe.requirements.map((req) => parseConditionalText(world, components, req)).join(', '),
            getItemBalance: (index: number) => getItemBalance(world, components, account.id, index),
            hasIngredients: (recipe: Recipe) => hasIngredients(world, components, recipe, account.id),
          },
        };
      })
    ),
  Render: ({ data, network, utils }) => {
      const { account } = data;
      const { actions, api, components, world } = network;
      const { hasIngredients } = utils;
      const [recipes, setRecipes] = useState<Recipe[]>([]);
      const [showAll, setShowAll] = useState<boolean>(true);
      const [tab, setTab] = useState('consumable'); //  consumable | material | reagent | special

      // update the list of recipes depending on the filter
      useEffect(() => {
        const recipes = getAllRecipes(world, components);
        const currentTabRecipes = recipes.filter((recipe) => recipe.type === tab.toUpperCase());
        if (showAll) setRecipes(currentTabRecipes);
        else setRecipes(currentTabRecipes.filter((recipe) => hasIngredients(recipe)));
      }, [showAll, tab]);

      /////////////////
      // INTERPRETATION

      const getIngredientsText = (ingredients: Ingredient[], multiplier: number) => {
        let text = '';
        ingredients.forEach((ingredient) => {
          const amount = ingredient.amount * multiplier;
          const name = ingredient.item?.name ?? 'Unknown';
          text += pluralize(name, amount, true) + ' ';
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
            return api.player.account.item.craft(recipe.index, amount);
          },
        });
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='crafting'
          header={<ModalHeader title='Crafting' icon={CraftIcon} />}
          canExit
        >
          <Tabs tab={tab} setTab={setTab} />
          <ActionButton onClick={() => setShowAll(!showAll)} text='Filter by Available' />
          {recipes.length == 0 ? (
            <EmptyText text={['There are no recipes here.', 'Look somewhere else!']} size={1} />
          ) : (
            <Recipes data={{ account, recipes, tab }} actions={{ craft }} utils={utils} />
          )}
        </ModalWrapper>
      );
  },
};
