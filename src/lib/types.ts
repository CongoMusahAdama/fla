export interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  imageLabels?: string[];
  sizes?: string[];
  stock: number;
  vendorId: string;
  vendorName: string;
  uniqueVendorId?: string;
  storeSlug?: string;
  description?: string;
  hasSizes?: boolean;
  hasColors?: boolean;
  colors?: string[];
  tailoringTime?: string;
  region?: string;
  vendorLocation?: string;
  vendorBio?: string;
  vendorDocumented?: boolean;
  vendorTier?: 'low' | 'high';
}
