'use client';

import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { signOut } from 'next-auth/react';
import { Menu, ShoppingCart, User, LogOut, LayoutDashboard, Gem, RotateCcw } from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetDescription,
} from '@/components/ui/sheet';

interface MobileNavProps {
  session: {
    user: {
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  } | null;
}

export default function MobileNav({ session }: MobileNavProps) {
  const { totalItems, items, removeFromCart, totalPrice } = useCart();

  if (!session) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-700 hover:text-purple-600 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span className="text-lg font-bold text-purple-600">Gemstone Earrings</span>
          </SheetTitle>
          <SheetDescription className="sr-only">Navigation menu</SheetDescription>
        </SheetHeader>

        {/* User Info */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col py-2">
          <SheetClose asChild>
            <Link
              href="/products"
              className="flex items-center gap-3 px-4 min-h-[44px] text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
            >
              <Gem className="w-5 h-5" />
              <span className="font-medium">Browse All</span>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              href="/returns"
              className="flex items-center gap-3 px-4 min-h-[44px] text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="font-medium">Returns</span>
            </Link>
          </SheetClose>

          {session.user.role === 'admin' && (
            <SheetClose asChild>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-4 min-h-[44px] text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-bold">Admin Dashboard</span>
              </Link>
            </SheetClose>
          )}
        </nav>

        {/* Cart Summary */}
        <div className="border-t px-4 py-3">
          <SheetClose asChild>
            <Link
              href="/cart"
              className="flex items-center justify-between min-h-[44px] text-gray-700 hover:text-purple-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Cart</span>
              </div>
              {totalItems > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">${totalPrice.toFixed(2)}</span>
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
              )}
            </Link>
          </SheetClose>

          {/* Cart Items Preview */}
          {items.length > 0 && (
            <div className="mt-2 space-y-2">
              {items.slice(0, 3).map(item => (
                <div key={item.product.pair_id} className="flex items-center justify-between text-sm">
                  <p className="text-gray-600 truncate flex-1 mr-2">
                    {item.product.gemstone.name}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-500">
                      ${item.product.pricing.total_pair_price.toFixed(2)} × {item.quantity}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.pair_id)}
                      className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Remove ${item.product.gemstone.name}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-gray-400">+{items.length - 3} more items</p>
              )}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="mt-auto border-t px-4 py-3">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 w-full min-h-[44px] text-red-600 hover:bg-red-50 rounded-lg px-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
