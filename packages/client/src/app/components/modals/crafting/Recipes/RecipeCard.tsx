import { useState } from 'react';
import styled from 'styled-components';

import { Card, CraftButton, Stepper, TextTooltip } from 'app/components/library';
import { ExpIcon, StaminaIcon } from 'assets/images/icons/stats';
import { Account } from 'network/shapes/Account';
import { NullItem } from 'network/shapes/Item';
import { Recipe } from 'network/shapes/Recipe';
import { Input } from './Input';

export const RecipeCard = ({
  data,
  actions,
  utils,
}: {
  data: {
    account: Account;
    recipe: Recipe;
    stamina: number;
  };
  actions: {
    craft: (amount: number) => void;
  };
  utils: {
    displayRequirements: (recipe: Recipe) => string;
    getItemBalance: (index: number) => number;
    meetsRequirements: (recipe: Recipe) => boolean;
  };
}) => {
  const { recipe, stamina } = data;
  const [quantity, setQuantity] = useState(1);

  const output = recipe.outputs[0];
  const inputs = recipe.inputs;
  const item = output.item ?? NullItem;
  const amt = output.amount;

  const getTooltipText = () => {
    const text = [
      `Requires: ${utils.displayRequirements(recipe)}`,
      `Grants: ${recipe.experience} xp`,
      `Costs: ${recipe.cost.stamina} stamina`,
    ];
    recipe.inputs.forEach((input) => {
      const itemName = input.item?.name ?? '???';
      text.push(`• ${input.amount} ${itemName}`);
    });

    return text;
  };

  return (
    <Card
      key={recipe.index}
      image={{
        icon: item.image,
        scale: 7.5,
        padding: 1,
        overlay: `${amt * quantity}`,
        tooltip: [item.description ?? ''],
      }}
      fullWidth
    >
      <TitleBar>
        <Stepper
          value={quantity}
          set={setQuantity}
          scale={2}
          min={1}
        />
        <TitleText>{item.name}</TitleText>
        <XpText>
          {recipe.experience * quantity}
          <Icon src={ExpIcon} />
        </XpText>
      </TitleBar>
      <Content>
        <TextTooltip
          text={getTooltipText()}
          direction='row'
          grow
        >
          <Inputs>
            {inputs.map((input, i) => (
              <Input
                key={`input-${i}`}
                image={input.item?.image ?? ''}
                amt={input.amount * quantity}
                prepend={i != 0 ? '+' : '='}
              />
            ))}
            <Input
              image={StaminaIcon}
              amt={recipe.cost.stamina * quantity}
              prepend='+'
            />
          </Inputs>
        </TextTooltip>
        <Actions>
          <CraftButton
            data={{ recipe, quantity, stamina }}
            actions={actions}
            utils={utils}
          />
        </Actions>
      </Content>
    </Card>
  );
};

const TitleBar = styled.div`
  border-bottom: solid black 0.15em;

  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
`;

const TitleText = styled.div`
  font-size: 0.9em;

  display: flex;
  justify-content: start;
  padding: 0.75em;
`;

const XpText = styled.div`
  flex-grow: 1;
  font-size: 0.9em;

  padding: 0.45em;
  gap: 0.15em;

  display: flex;
  align-items: center;
  justify-content: end;
  flex-wrap: wrap;
`;

const Icon = styled.img`
  height: 1.2em;
`;

const Content = styled.div`
  flex-grow: 1;

  display: flex;
  padding: 0.4em;
  gap: 1rem;
`;

const Inputs = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
`;

const Actions = styled.div`
  align-self: end;

  display: flex;
  gap: 0.4em;
`;
