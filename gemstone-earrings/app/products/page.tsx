import { getProductsServer } from '@/lib/products-server';
import ProductsListing from '@/components/ProductsListing';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getProductsServer();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">Browse All Earrings</h1>
      <ProductsListing initialProducts={products} />
    </div>
  );
}
