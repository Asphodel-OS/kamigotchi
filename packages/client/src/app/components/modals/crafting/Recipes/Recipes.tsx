import { calcCurrentStamina } from 'app/cache/account';
import { Account } from 'network/shapes/Account';
import { Recipe } from 'network/shapes/Recipe';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { RecipeCard } from './RecipeCard';

interface Props {
  data: {
    account: Account;
    recipes: Recipe[];
    tab: string;
  };
  actions: {
    craft: (recipe: Recipe, amount: number) => void;
  };
  utils: {
    displayRequirements: (recipe: Recipe) => string;
    getItemBalance: (index: number) => number;
    meetsRequirements: (recipe: Recipe) => boolean;
  };
}

export const Recipes = (props: Props) => {
  const { actions, data, utils } = props;
  const { account, recipes, tab } = data;
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
    <>
      {recipes.map((recipe) => {
        const recipeTab = recipe.type.toLowerCase();
        return (
          <Tab key={recipe.index} isVisible={tab === recipeTab}>
            <RecipeCard
              key={recipe.index}
              data={{ account, recipe, stamina }}
              actions={{ craft: (amt: number) => craft(recipe, amt) }}
              utils={utils}
            />
          </Tab>
        );
      })}
    </>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row wrap;
  margin-top: 0.6vw;
  gap: 0.6vw;
  user-select: none;
`;
