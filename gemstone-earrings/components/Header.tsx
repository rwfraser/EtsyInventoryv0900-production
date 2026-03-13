'use client';

import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetDescription,
} from '@/components/ui/sheet';
import MobileNav from '@/components/MobileNav';

export default function Header() {
  const { totalItems, items, removeFromCart, totalPrice } = useCart();
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile: hamburger menu */}
          <MobileNav session={session} />

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl md:text-3xl">💎</span>
            <h1 className="text-lg md:text-2xl font-bold text-purple-600">
              Gemstone Earrings
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {session && (
              <>
                <Link href="/products" className="text-gray-700 hover:text-purple-600 font-medium">
                  Browse All
                </Link>
                <Link href="/returns" className="text-gray-700 hover:text-purple-600 font-medium">
                  Returns
                </Link>
                {session.user.role === 'admin' && (
                  <Link href="/admin/dashboard" className="text-purple-600 hover:text-purple-800 font-bold">
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right-side icons (user + cart) */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* User Menu — Desktop: DropdownMenu, Mobile: handled in MobileNav */}
            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden md:flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-700 hover:text-purple-600 transition-colors"
                    aria-label="User menu"
                  >
                    <User className="w-6 h-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                      {session.user.role === 'admin' && (
                        <span className="inline-block w-fit mt-0.5 px-2 py-0.5 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {session.user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Cart — Sheet slide-in (works on all breakpoints) */}
            {session && (
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="relative flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-700 hover:text-purple-600 transition-colors"
                    aria-label="Open cart"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {totalItems > 0 && (
                      <span className="absolute top-1 right-0 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
                  <SheetHeader className="border-b px-4 py-4">
                    <SheetTitle>Shopping Cart</SheetTitle>
                    <SheetDescription>
                      {totalItems === 0
                        ? 'Your cart is empty'
                        : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
                    </SheetDescription>
                  </SheetHeader>

                  {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
                      <div>
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Your cart is empty</p>
                        <SheetClose asChild>
                          <Link
                            href="/products"
                            className="inline-block mt-4 text-purple-600 hover:underline font-medium"
                          >
                            Browse Products
                          </Link>
                        </SheetClose>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {items.map(item => (
                          <div key={item.product.pair_id} className="flex items-center justify-between pb-3 border-b">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">
                                {item.product.gemstone.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                ${item.product.pricing.total_pair_price.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.pair_id)}
                              className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                              aria-label={`Remove ${item.product.gemstone.name}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t p-4 bg-gray-50">
                        <div className="flex justify-between font-bold text-lg mb-3">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                        <SheetClose asChild>
                          <Link
                            href="/cart"
                            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded text-center min-h-[44px]"
                          >
                            View Cart & Checkout
                          </Link>
                        </SheetClose>
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
