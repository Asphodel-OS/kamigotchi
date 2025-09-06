import { Dispatch, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Text } from 'app/components/library';
import { Item, NullItem } from 'network/shapes';
import { ItemCard } from './ItemCard';

export type CategoryKey = string; // dynamic categories plus grouped: 'All' | 'Consumables' | 'Materials' | 'Currencies'

export const ItemBrowser = ({
  items,
  selected,
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
    // Notify offers pane to filter by category (including 'All')
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('trading:filterOffersByCategory', { detail: c }));
      } catch {}
    }
    // Clear item selection when switching to 'All'
    if ((c as string) === 'All') {
      try { setSelected(NullItem); } catch {}
    }
  };
  // Build category list dynamically: reserved groups + all remaining item.type values
  const categories: { key: CategoryKey; label: string }[] = useMemo(() => {
    const reserved = [
      { key: 'All', label: 'Show All' },
      { key: 'Consumables', label: 'Consumables' },
      { key: 'Materials', label: 'Materials' },
      { key: 'Currencies', label: 'Currencies' },
    ];
    const consumableTypes = new Set(['FOOD', 'REVIVE', 'CONSUMABLE', 'LOOTBOX']);
    const dynamic = new Set<string>();
    for (const item of items) {
      const t = (item.type || '').toUpperCase();
      if (consumableTypes.has(t) || t === 'MATERIAL' || t === 'ERC20') continue;
      dynamic.add(t);
    }
    const toTitle = (s: string) => s.toLowerCase().replace(/(^|[_\-\s])([a-z])/g, (_, p1, p2) => `${p1 ? ' ' : ''}${p2.toUpperCase()}`).trim();
    const dynamicList = Array.from(dynamic).sort().map((t) => ({ key: t, label: toTitle(t) }));
    return [...reserved, ...dynamicList];
  }, [items]);

  const categorized = useMemo(() => {
    const byCat = new Map<CategoryKey, Item[]>();
    byCat.set('All', []);
    byCat.set('Consumables', []);
    byCat.set('Materials', []);
    byCat.set('Currencies', []);

    const consumableTypes = new Set(['FOOD', 'REVIVE', 'CONSUMABLE', 'LOOTBOX']);

    for (const item of items) {
      const type = (item.type || '').toUpperCase();
      let key: CategoryKey = type;
      if (consumableTypes.has(type)) key = 'Consumables';
      else if (type === 'MATERIAL') key = 'Materials';
      else if (type === 'ERC20') key = 'Currencies';

      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(item);
      byCat.get('All')!.push(item);
    }

    for (const key of byCat.keys()) byCat.get(key)!.sort((a, b) => a.name.localeCompare(b.name));
    return byCat;
  }, [items]);

  const list = categorized.get(category) ?? [];

  return (
    <Container>
      <Sidebar>
        <Text size={1.1} padding={{ bottom: 0.6 }}>
          Categories
        </Text>
        {categories.map((c) => (
          <CategoryButton key={c.key} onClick={() => setCategory(c.key)} disabled={category === c.key}>
            {c.label}
          </CategoryButton>
        ))}
      </Sidebar>
      <Right>
        <TableWrap>
          <ListTable>
            <thead>
              <HeaderRow>
                <th>Item</th>
                <th>Type</th>
              </HeaderRow>
            </thead>
            <tbody>
              {list.map((item) => (
                <DataRow key={item.index} selected={item.index === selected.index} onClick={() => setSelected(item)}>
                  <td>
                    <RowItem>
                      <Thumb src={item.image} alt={item.name} />
                      <RowName title={item.name}>{item.name}</RowName>
                    </RowItem>
                  </td>
                  <td>{item.type}</td>
                </DataRow>
              ))}
            </tbody>
          </ListTable>
        </TableWrap>
      </Right>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  gap: 0.6vw;
  min-height: 0;
`;

const Sidebar = styled.div`
  width: 40%;
  padding: 0.6vw;
  display: flex;
  flex-direction: column;
  gap: 0.3vw;
  border-right: 0.15vw solid black;
  flex: 0 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
`;

const CategoryButton = styled.button`
  border: 0.12vw solid black;
  background: #efefef;
  padding: 0.24vw 0.45vw;
  text-align: left;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.85vw;
  cursor: pointer;
  &:disabled {
    background: #dcdcdc;
    cursor: default;
  }
`;

const Right = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
`;

const DetailsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6vw;
`;

const SelectedWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
`;

const Thumb = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  image-rendering: pixelated;
`;

const SelectedName = styled.div`
  max-width: 18vw;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 1vw;
`;

const ClearButton = styled.button`
  border: 0.12vw solid black;
  background: #f5f5f5;
  padding: 0.45vw 0.9vw;
  cursor: pointer;
  &:disabled {
    background: #e5e5e5;
    cursor: default;
  }
`;

const TableWrap = styled.div`
  width: 100%;
  padding: 0.6vw;
  overflow: auto;
  scrollbar-color: auto;
`;

const ListTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const HeaderRow = styled.tr`
  position: sticky;
  top: 0;
  background: #e6e6e6;
  & > th {
    text-align: left;
    padding: 0.45vw 0.6vw;
    border-bottom: 0.12vw solid black;
    font-size: 0.9vw;
  }
`;

const DataRow = styled.tr<{ selected: boolean }>`
  cursor: pointer;
  background: ${({ selected }) => (selected ? '#e9ffe9' : 'transparent')};
  & > td {
    padding: 0.45vw 0.6vw;
    border-bottom: 0.06vw solid #ccc;
    font-size: 0.9vw;
  }
`;

const RowItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
`;

const RowName = styled.div`
  max-width: 18vw;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;


