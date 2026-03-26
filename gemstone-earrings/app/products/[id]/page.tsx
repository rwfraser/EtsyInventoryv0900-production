import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductByIdServer } from '@/lib/products-server';
import ProductDetail from '@/components/ProductDetail';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductByIdServer(id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
