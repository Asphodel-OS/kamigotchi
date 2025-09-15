import React from 'react';
import styled from 'styled-components';

import { IconListButton } from 'app/components/library/buttons';
import { MenuIcons } from 'assets/images/icons/menu';

export type ItemCategory = 'All' | 'Consumables' | 'Lootboxes' | 'Materials';

interface CategoryFilterProps {
  selectedCategory: ItemCategory;
  onCategoryChange: (category: ItemCategory) => void;
}

const categories = [
  { 
    id: 'All' as ItemCategory, 
    label: 'All', 
    description: 'Show all items'
  },
  { 
    id: 'Consumables' as ItemCategory, 
    label: 'Consumables', 
    description: 'Food, potions, and kami items'
  },
  { 
    id: 'Lootboxes' as ItemCategory, 
    label: 'Lootboxes', 
    description: 'Gacha tickets and mystery boxes'
  },
  { 
    id: 'Materials' as ItemCategory, 
    label: 'Materials', 
    description: 'Crafting materials and drops'
  },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const categoryOptions = categories.map((category) => ({
    text: category.label,
    onClick: () => onCategoryChange(category.id),
  }));

  return (
    <Container>
      <IconListButton
        img={MenuIcons.more}
        text={selectedCategory}
        options={categoryOptions}
        radius={0.6}
      />
    </Container>
  );
};

// Helper function to categorize items (exported for use in ItemGrid)
export const categorizeItem = (item: any): ItemCategory => {
  const { type } = item;
  
  // Lootboxes
  if (type === 'LOOTBOX') {
    return 'Lootboxes';
  }
  
  // Consumables
  if (['FOOD', 'REVIVE', 'SKILL_RESET', 'RENAME_POTION'].includes(type)) {
    return 'Consumables';
  }
  
  // Default to Materials for everything else (including currencies)
  return 'Materials';
};

const Container = styled.div`
  margin-bottom: 0.4vw;
`;

