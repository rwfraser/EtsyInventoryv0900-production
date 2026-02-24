'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    result: any;
  };
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message Bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Product Cards (if function call returned products) */}
        {!isUser && message.functionCall?.name === 'searchProducts' && (
          <ProductCards products={message.functionCall.result.products} />
        )}

        {/* Timestamp */}
        <p className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

function ProductCards({ products }: { products?: any[] }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {products.slice(0, 3).map(product => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="block bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="flex gap-3">
            {/* Product Image */}
            {product.images && product.images.length > 0 && (
              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {product.name}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                {product.description}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-purple-600">
                  ${product.price.toFixed(2)}
                </span>
                {product.inStock ? (
                  <span className="text-xs text-green-600">In Stock</span>
                ) : (
                  <span className="text-xs text-gray-400">Out of Stock</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
      {products.length > 3 && (
        <p className="text-xs text-gray-500 text-center">
          + {products.length - 3} more products
        </p>
      )}
    </div>
  );
}
