import type { Product as VendorProduct } from '@/components/dashboard/VendorProducts';

/** Map API product document → vendor dashboard card model */
export function mapApiProductToVendorProduct(prod: any): VendorProduct {
  return {
    id: prod._id,
    name: prod.name,
    price: prod.price?.toString?.() ?? String(prod.price ?? ''),
    image: prod.images?.[0] || '/product-1.jpg',
    images:
      prod.images?.map((img: string, idx: number) => ({
        url: img,
        label: prod.imageLabels?.[idx] || 'Product',
      })) || [],
    status: prod.stock < 10 ? 'Low Stock' : 'In Stock',
    sales: 0,
    quantity: prod.stock,
    tailoringTime: prod.tailoringTime || '3 Days',
    region: prod.region || 'Greater Accra',
    description: prod.description || '',
    category: prod.category || 'T-Shirt',
    listingMode: prod.listingMode === 'contact' || prod.listingMode === 'both' ? prod.listingMode : 'shop',
    imageLabels: prod.imageLabels || [],
    sizes: prod.sizes || [],
    hasSizes: prod.hasSizes !== undefined ? prod.hasSizes : true,
    colors: prod.colors || [],
    hasColors: prod.hasColors !== undefined ? prod.hasColors : true,
    colorStock: prod.colorStock,
    sizeStock: prod.sizeStock,
    variantStock: prod.variantStock,
    isActive: prod.isActive,
  };
}

export function parseProductsListResponse(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { products?: unknown }).products)) {
    return (data as { products: any[] }).products;
  }
  return [];
}
