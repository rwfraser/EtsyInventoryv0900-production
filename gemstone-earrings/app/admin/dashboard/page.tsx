import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { users, products } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export default async function AdminDashboard() {
  const session = await requireAdmin();
  
  // Get user count
  const allUsers = await db.select().from(users);
  const userCount = allUsers.length;
  const adminCount = allUsers.filter(u => u.role === 'admin').length;

  // Get product counts
  const dbProducts = await db.select().from(products);
  const dbProductCount = dbProducts.length;
  
  // Get static products count from JSON
  let staticProductCount = 0;
  try {
    const productsJsonPath = path.join(process.cwd(), 'public', 'products.json');
    const productsJson = JSON.parse(fs.readFileSync(productsJsonPath, 'utf-8'));
    staticProductCount = productsJson.total_combinations || 0;
  } catch (error) {
    console.error('Failed to read products.json:', error);
  }
  
  const totalProducts = staticProductCount + dbProductCount;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.name || session.user.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducts}</p>
            <p className="text-xs text-gray-500 mt-1">{staticProductCount} static + {dbProductCount} database</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{userCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Administrators</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{adminCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Regular Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{userCount - adminCount}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/users"
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </Link>
            <Link
              href="/admin/products"
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">💎</div>
              <h3 className="font-semibold text-gray-900">Manage Products</h3>
              <p className="text-sm text-gray-600">Add and edit products</p>
            </Link>
            <Link
              href="/admin/orders"
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">📦</div>
              <h3 className="font-semibold text-gray-900">Manage Orders</h3>
              <p className="text-sm text-gray-600">View and process orders</p>
            </Link>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
