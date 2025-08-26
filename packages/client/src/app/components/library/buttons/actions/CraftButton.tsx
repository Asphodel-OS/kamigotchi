import { IconButton, TextTooltip } from 'app/components/library';
import { CraftIcon } from 'assets/images/icons/actions';
import { Recipe } from 'network/shapes/Recipe';
import { playMessage } from 'utils/sounds';

export const CraftButton = ({
  data,
  actions,
  utils,
}: {
  data: {
    quantity: number; // quantity to craft
    recipe: Recipe; // the recipe to craft
    stamina: number; // the current stamina of player
  };
  actions: {
    craft: (amount: number) => void;
  };
  utils: {
    meetsRequirements: (recipe: Recipe) => boolean;
    displayRequirements: (recipe: Recipe) => string;
    getItemBalance: (index: number) => number;
  };
}) => {
  const { craft } = actions;
  const { quantity, recipe, stamina } = data;
  const { meetsRequirements, displayRequirements, getItemBalance } = utils;

  const handleCraft = () => {
    playMessage();
    craft(quantity);
  };

  /////////////////
  // VALIDATION

  const isDisabled = () => {
    return !meetsRequirements(recipe) || !meetsInputs() || !meetsStamina();
  };

  // determine disabled tooltip from validations
  const getDisabledTooltip = () => {
    let tooltip = '';
    if (!meetsRequirements(recipe)) tooltip = 'Requires: \n' + displayRequirements(recipe);
    else if (!meetsInputs()) tooltip = 'Not enough items';
    else if (!meetsStamina()) tooltip = 'Not enough stamina';
    return `Craft (${quantity})`;
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

  /////////////////
  // DISPLAY

  return (
    <TextTooltip key='craft-tooltip' text={[getDisabledTooltip()]}>
      <IconButton onClick={handleCraft} img={CraftIcon} disabled={isDisabled()} />
    </TextTooltip>
  );
};
