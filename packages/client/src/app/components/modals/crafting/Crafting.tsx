import pluralize from 'pluralize';
import { useEffect, useState } from 'react';

import { getAccount } from 'app/cache/account';
import { getItemByIndex as _getItemByIndex } from 'app/cache/item';
import { getAllRecipes } from 'app/cache/recipes';
import { ActionButton, EmptyText, ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { CraftIcon } from 'assets/images/icons/actions';
import { Account, queryAccountFromEmbedded } from 'network/shapes/Account';
import { parseAllos as _parseAllos, Allo } from 'network/shapes/Allo';
import { parseConditionalText, passesConditions } from 'network/shapes/Conditional';
import { getItemBalance as _getItemBalance, Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { hasIngredients as _hasIngredients, Ingredient, Recipe } from 'network/shapes/Recipe';
import { Recipes } from './Recipes/Recipes';
import { Tabs } from './tabs/Tabs';

export const CraftingModal: UIComponent = {
  id: 'CraftingModal',
  Render: () => {
    const layers = useLayers();

    const {
      network: { actions, api, components, world },
      data: { account },
      utils: {
        meetsRequirementsRecipe,
        meetsRequirements,
        displayRecipeRequirements,
        displayItemRequirements,
        getItemBalance,
        hasIngredients,
        parseAllos,
        getItemByIndex,
      },
    } = (() => {
      const { network } = layers;
      const { world, components } = network;

      const accountEntity = queryAccountFromEmbedded(network);
      const account = getAccount(world, components, accountEntity, { live: 2, config: 3600 });

      return {
        network,
        data: { account },
        utils: {
          meetsRequirementsRecipe: (recipe: Recipe) =>
            passesConditions(world, components, recipe.requirements, account),
          meetsRequirements: (holder: Kami | Account, item: Item) =>
            passesConditions(world, components, item.requirements.use, holder),
          // TODO: horrendous pattern. refactor when/how we parse conditional text
          displayRecipeRequirements: (recipe: Recipe) => {
            return recipe.requirements
              .map((req) => parseConditionalText(world, components, req))
              .join(', ');
          },
          displayItemRequirements: (item: Item) => {
            return item.requirements.use
              .map((req) => parseConditionalText(world, components, req))
              .join('\n ');
          },
          getItemBalance: (index: number) => _getItemBalance(world, components, account.id, index),
          hasIngredients: (recipe: Recipe) =>
            _hasIngredients(world, components, recipe, account.id),
          parseAllos: (allo: Allo[]) => _parseAllos(world, components, allo),
          getItemByIndex: (index: number) => _getItemByIndex(world, components, index),
        },
      };
    })();

    const setModals = useVisibility((s) => s.setModals);
    const craftingModalVisible = useVisibility((s) => s.modals.crafting);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [showAll, setShowAll] = useState<boolean>(true);
    const [tab, setTab] = useState('consumable'); //  consumable | material | reagent | special

    /////////////////
    useEffect(() => {
      if (!craftingModalVisible) return;
      // close lootbox modal
      setModals({ lootBox: false });
    }, [craftingModalVisible]);

    // update the list of recipes depending on the filter
    useEffect(() => {
      const recipes = getAllRecipes(world, components);
      const currentTabRecipes = recipes.filter((recipe) => recipe.type === tab.toUpperCase());
      if (showAll) setRecipes(currentTabRecipes);
      else
        setRecipes(
          currentTabRecipes.filter(
            (recipe) => meetsRequirementsRecipe(recipe) && hasIngredients(recipe)
          )
        );
    }, [showAll, tab, craftingModalVisible]);

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
          <Recipes
            data={{
              account,
              recipes,
              tab,
            }}
            actions={{
              craft,
            }}
            utils={{
              meetsRequirementsRecipe,
              meetsRequirements,
              displayRecipeRequirements,
              displayItemRequirements,
              getItemBalance,
              parseAllos,
              getItemByIndex,
            }}
          />
        )}
      </ModalWrapper>
    );
  },
};
