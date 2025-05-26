import { useState } from 'react';
import styled from 'styled-components';

import { Card, CraftButton, Stepper, TextTooltip } from 'app/components/library';
import { ExpIcon, StaminaIcon } from 'assets/images/icons/stats';
import { Account } from 'network/shapes/Account';
import { NullItem } from 'network/shapes/Item';
import { Recipe } from 'network/shapes/Recipe';
import { Input } from './Input';

interface Props {
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
}

export const RecipeCard = (props: Props) => {
  const { actions, data, utils } = props;
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
        <Stepper value={quantity} set={setQuantity} scale={2} min={1} />
        <TitleText key='title'>{item.name}</TitleText>
        <TitleCorner key='corner'>
          <Text>{recipe.experience * quantity}</Text>
          <Icon src={ExpIcon} />
        </TitleCorner>
      </TitleBar>
      <Content>
        <TextTooltip text={getTooltipText()} direction='row' grow>
          <ContentRow key='column-1'>
            {inputs.map((input, i) => (
              <Input
                key={`input-${i}`}
                image={input.item?.image ?? ''}
                amt={input.amount * quantity}
                prepend={i != 0 ? '+' : '='}
              />
            ))}
            <Input image={StaminaIcon} amt={recipe.cost.stamina * quantity} prepend='+' />
          </ContentRow>
        </TextTooltip>
        <ContentColumn key='column-2'>
          <Actions>
            <CraftButton data={{ recipe, quantity, stamina }} actions={actions} utils={utils} />
          </Actions>
        </ContentColumn>
      </Content>
    </Card>
  );
};

const TitleBar = styled.div`
  border-bottom: solid black 0.15vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  user-select: none;
`;

const TitleText = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 0.6vw;

  font-size: 0.9vw;
  text-align: left;
`;

const TitleCorner = styled.div`
  padding: 0.45vw;
  gap: 0.15vw;

  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: flex-end;
`;

const Text = styled.div`
  font-size: 0.9vw;
  padding-top: 0.05vw;
`;

const Icon = styled.img`
  height: 1.2vw;
`;

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  align-items: stretch;

  padding: 0.2vw;
`;

const ContentRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;

const ContentColumn = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex-grow: 1;
  justify-content: flex-end;

  margin: 0.2vw;
  padding-top: 0.2vw;
`;

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  gap: 0.4vw;
`;
