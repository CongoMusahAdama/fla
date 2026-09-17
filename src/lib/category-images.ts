/**
 * Fixed category artwork for "Browse by category" — never use live product photos
 * (uploads can 404, localhost URLs break in prod, and tiles flicker when inventory changes).
 */
export const CATEGORY_TILE_IMAGES: Record<string, string> = {
  Electronics:
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80',
  'Home goods':
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&q=80',
  Kitchen:
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop&q=80',
  'Beauty/cosmetics':
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&q=80',
  Accessories:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80',
  Clothing:
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop&q=80',
  Shoes:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&q=80',
  Bags:
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop&q=80',
  'Used items':
    'https://images.unsplash.com/photo-1565043582261-0f3862fb1227?w=400&h=400&fit=crop&q=80',
  Wholesaler:
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop&q=80',
  'For men':
    'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop&q=80',
  'For women':
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop&q=80',
  'Children/Toys':
    'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop&q=80',
  Furniture:
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80',
  'Food/beverages':
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop&q=80',
  'Hardware items':
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop&q=80',
  'Building materials':
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=400&fit=crop&q=80',
  'Refurbished items':
    'https://images.unsplash.com/photo-1563013547-824ae1b704d3?w=400&h=400&fit=crop&q=80',
  Unisex:
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop&q=80',
};

export const DEFAULT_CATEGORY_TILE_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&q=80';

export function getCategoryTileImage(categoryLabel: string): string {
  return CATEGORY_TILE_IMAGES[categoryLabel] || DEFAULT_CATEGORY_TILE_IMAGE;
}
