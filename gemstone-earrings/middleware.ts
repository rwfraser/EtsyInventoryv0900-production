export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    '/products/:path*',
    '/cart/:path*',
    '/returns/:path*',
    '/api/cart/:path*',
  ],
};
