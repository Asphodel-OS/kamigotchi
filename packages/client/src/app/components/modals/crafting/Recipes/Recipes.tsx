import { calcCurrentStamina } from 'app/cache/account';
import { Item, Kami } from 'network/shapes';
import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Recipe } from 'network/shapes/Recipe';
import { DetailedEntity } from 'network/shapes/utils';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { RecipeCard } from './RecipeCard';

export const Recipes = ({
  data,
  actions,
  utils,
}: {
  data: {
    account: Account;
    recipes: Recipe[];
    tab: string;
  };
  actions: {
    craft: (recipe: Recipe, amount: number) => void;
  };
  utils: {
    displayRecipeRequirements: (recipe: Recipe) => string;
    displayItemRequirements: (item: Item) => string;
    getItemBalance: (index: number) => number;
    meetsRequirementsRecipe: (recipe: Recipe) => boolean;
    meetsRequirements: (holder: Kami | Account, item: Item) => boolean;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
    getItemByIndex: (itemIndex: number) => Item;
  };
}) => {
  const { account, recipes } = data;
  const { craft } = actions;

  const [stamina, setStamina] = useState(0);
  const [tick, setTick] = useState(Date.now());

  // ticking
  useEffect(() => {
    const timer = () => setTick(Date.now());
    const timerID = setInterval(timer, 5000);
    return () => clearInterval(timerID);
  }, []);

  // update stamina on each tick
  useEffect(() => {
    setStamina(calcCurrentStamina(account));
  }, [account.stamina.sync, tick]);

  return (
    <Container>
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.index}
          data={{ account, recipe, stamina }}
          actions={{ craft: (amt: number) => craft(recipe, amt) }}
          utils={utils}
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: row wrap;
  margin-top: 0.6vw;
  gap: 0.6vw;

  user-select: none;
  min-width: fit-content;
`;
