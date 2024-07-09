import { ItemImages } from 'assets/images/items';

// clean up name of item to standard format and query out map of item images
export const getImage = (name: string) => {
  name = name.toLowerCase();
  name = name.replaceAll(/ /g, '_').replaceAll(/-/g, '_');
  name = name.replaceAll('(', '').replaceAll(')', '');
  const key = name as keyof typeof ItemImages;
  if (!key) throw new Error(`No image found for ${name}`);

  return ItemImages[key];
};
