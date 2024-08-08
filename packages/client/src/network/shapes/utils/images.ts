import { ItemImages } from 'assets/images/items';
import { AffinityIcons } from 'constants/affinities';

export const getAffinityImage = (name: string | undefined) => {
  if (!name) return '';
  name = name.toLowerCase();
  const key = name as keyof typeof AffinityIcons;
  if (!key) throw new Error(`No image found for ${name}`);

  return AffinityIcons[key];
};

// clean up name of item to standard format and query out map of item images
export const getItemImage = (name: string) => {
  name = name.toLowerCase();
  name = name.replaceAll(/ /g, '_').replaceAll(/-/g, '_');
  name = name.replaceAll('(', '').replaceAll(')', '');
  const key = name as keyof typeof ItemImages;
  if (!key) throw new Error(`No image found for ${name}`);

  return ItemImages[key];
};
