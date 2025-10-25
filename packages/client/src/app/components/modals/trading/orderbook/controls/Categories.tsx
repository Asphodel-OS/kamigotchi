import { Dispatch, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Item, NullItem } from 'network/shapes';
import { toTitle } from 'utils/strings';
import { CONSUMABLE_TYPES } from './constants';

export type CategoryKey = string; // dynamic categories plus grouped: 'All' | 'Consumables' | 'Materials' | 'Currencies'

export const Categories = ({
  items,
  setSelected,
  category: controlledCategory,
  onCategoryChange,
}: {
  items: Item[];
  selected: Item;
  setSelected: Dispatch<Item>;
  category?: CategoryKey;
  onCategoryChange?: Dispatch<CategoryKey>;
}) => {
  const [internalCategory, setInternalCategory] = useState<CategoryKey>('All');
  const category = controlledCategory ?? internalCategory;
  const setCategory = (c: CategoryKey) => {
    if (onCategoryChange) onCategoryChange(c);
    setInternalCategory(c);
    // Notify offers pane to filter by category
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('trading:filterOffersByCategory', { detail: c }));
      } catch {}
    }
    // Clear item selection when switching to 'All'
    if ((c as string) === 'All') {
      try {
        setSelected(NullItem);
      } catch {}
    }
  };

  // Build category list dynamically from item types
  const categories: { key: CategoryKey; label: string }[] = useMemo(() => {
    const reserved = [
      { key: 'All', label: 'Show All' },
      { key: 'Consumables', label: 'Consumables' },
      { key: 'Materials', label: 'Materials' },
      { key: 'Currencies', label: 'Currencies' },
    ];

    const dynamic = new Set<string>();

    // Collect unique item types that aren't already categorized
    for (const item of items) {
      const t = (item.type || '').toUpperCase();
      if (!t) continue;
      if (CONSUMABLE_TYPES.has(t) || t === 'MATERIAL' || t === 'ERC20') continue;
      dynamic.add(t);
    }

    // Transform dynamic types into sorted list of category options
    const dynamicList = Array.from(dynamic)
      .sort()
      .map((t) => ({ key: t, label: toTitle(t) }));
    return [...reserved, ...dynamicList];
  }, [items]);

  return (
    <Container>
      <TitleBar>Categories</TitleBar>
      {categories.map((c) => (
        <CategoryButton
          key={c.key}
          onClick={() => setCategory(c.key)}
          disabled={category === c.key}
        >
          {c.label}
        </CategoryButton>
      ))}
    </Container>
  );
};

const Container = styled.div`
  border-right: 0.15vw solid black;
  width: 40%;
  gap: 0.3vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;

  overflow-y: scroll;
`;

const TitleBar = styled.div`
  border-bottom: 0.12vw solid black;
  background: rgb(221, 221, 221);
  position: sticky;
  top: 0;

  width: 100%;
  padding: 0.45vw 0.6vw;
  font-size: 0.9vw;
  opacity: 0.9;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  justify-content: space-between;
`;

const CategoryButton = styled.button`
  border: 0.12vw solid black;
  background: #efefef;

  padding: 0.24vw 0.45vw;
  width: 90%;

  text-align: left;
  text-overflow: ellipsis;
  font-size: 0.85vw;
  white-space: nowrap;

  cursor: pointer;
  &:disabled {
    background: #dcdcdc;
    cursor: default;
  }
`;
