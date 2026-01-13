import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns Policy - Gemstone Earrings',
  description: 'Our merchandise return policy for gemstone earrings',
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Merchandise Return Policy</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-lg mb-6">
          We want you to be fully satisfied with your purchase. If for any reason you are not, you may return any eligible item within <strong>7 days</strong> of delivery, provided the merchandise is returned in <strong>perfect, unused condition</strong> and in its <strong>original packaging</strong>.
        </p>

        <p className="mb-4">Please note the following conditions:</p>

        <ul className="list-disc pl-6 mb-6 space-y-3">
          <li>
            All returns must be initiated within <strong>7 calendar days</strong> of receiving your order.
          </li>
          <li>
            Items must be returned in their <strong>original, undamaged condition</strong>, with all tags, accessories, and packaging included.
          </li>
          <li>
            <strong>Customers are responsible for all return shipping costs.</strong> We recommend using a trackable shipping method, as we cannot issue refunds for items lost or damaged during return transit.
          </li>
          <li>
            Once your return is received and inspected, a refund will be issued to your original method of payment, excluding any shipping fees from the original order.
          </li>
          <li>
            Items that show signs of wear, use, or damage may not be eligible for a refund.
          </li>
        </ul>

        <p className="text-gray-700 mt-8">
          If you have questions about the return process, please contact our customer support team before sending your item back.
        </p>
      </div>
    </div>
  );
}
