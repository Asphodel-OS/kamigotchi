import { IconButton, Tooltip } from 'app/components/library';
import { CraftIcon } from 'assets/images/icons/actions';
import { Recipe } from 'network/shapes/Recipe';

interface Props {
  data: {
    quantity: number; // quantity to craft
    recipe: Recipe; // the recipe to craft
    stamina: number; // the current stamina of player
  };
  actions: {
    craft: (recipe: Recipe, amount: number) => void;
  };
  utils: {
    meetsRequirements: (recipe: Recipe) => boolean;
    displayRequirements: (recipe: Recipe) => string;
    getItemBalance: (index: number) => number;
  };
}

export const CraftButton = (props: Props) => {
  const { actions, data, utils } = props;
  const { quantity, recipe, stamina } = data;
  const { meetsRequirements, displayRequirements, getItemBalance } = utils;

  /////////////////
  // VALIDATION

  // determine disabled tooltip from validations
  const getDisabledTooltip = () => {
    let tooltip = '';
    if (!meetsRequirements(recipe)) tooltip = 'Requires: \n' + displayRequirements(recipe);
    else if (!meetsInputs()) tooltip = 'Not enough items';
    else if (!meetsStamina()) tooltip = 'Not enough stamina';
    return tooltip;
  };

  // validate whether the player has sufficient item balances for the recipe
  const meetsInputs = () => {
    let sufficient = true;
    recipe.inputs.forEach((input) => {
      const have = getItemBalance(input.index);
      if (have < input.amount * quantity) sufficient = false;
    });
    return sufficient;
  };

  // validate whether the player has sufficient stamina for the recipe
  const meetsStamina = () => {
    return stamina >= recipe.cost.stamina * quantity;
  };

  // determine the tooltip / disabled status based on validations
  // NOTE: a bit of an antipattern that we really shouldnt be encouraging
  let tooltip = getDisabledTooltip();
  const disabled = !!tooltip;
  if (!disabled) tooltip = `Craft (${quantity})`;

  /////////////////
  // DISPLAY

  return (
    <Tooltip key='craft-tooltip' text={[tooltip]}>
      <IconButton onClick={() => actions.craft(recipe, 1)} img={CraftIcon} disabled={disabled} />
    </Tooltip>
  );
};
