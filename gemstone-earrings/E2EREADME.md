# End-to-End (E2E) Testing Plan

## Status: Not Yet Implemented

The 56 existing unit/integration tests (Vitest) cover backend logic. E2E tests will add browser-level confidence in frontend rendering and full user flows.

## Framework

**Playwright** — cross-browser testing (Chromium, Firefox, WebKit), built-in auto-waiting, screenshot/video on failure.

## Prerequisites

```powershell
npm install --save-dev @playwright/test
npx playwright install
```

## Target Environment

E2E tests should run against a **Vercel preview URL** or **localhost dev server**, not production.

- Preview URL: automatically created on each Vercel push to a non-main branch
- Local: `npm run dev` (http://localhost:3000)

## Planned Test Flows

### 1. Homepage & Products
- Homepage loads with hero section and featured products
- Products page renders product cards
- Product detail page shows name, price, images
- Filtering and sorting work correctly

### 2. Authentication
- Signup form validates required fields
- Signup creates account and shows verification message
- Login rejects unverified users
- Login succeeds with verified credentials
- Logout clears session

### 3. Shopping Cart
- Add product to cart from product detail page
- Cart page shows added item with correct quantity
- Quantity controls work (increment, decrement, remove)
- Cart persists across page navigation

### 4. Admin Product Management
- Non-admin users cannot access /admin routes
- Admin can view product list
- Admin can create product with auto-generated SKU
- Admin can edit existing product

### 5. Chat Widget
- Chat button appears on all pages
- Chat opens and accepts user input
- Chat returns AI-generated response

## Configuration

The Playwright config should be created at `playwright.config.ts` with:
- Base URL pointing to preview/local environment
- Timeout: 30 seconds per test
- Retries: 1 on CI, 0 locally
- Screenshots on failure
- Video recording on first retry

## Test Scripts (to add to package.json)

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed"
}
```

## Considerations

- E2E tests are slower (seconds per test vs milliseconds for unit tests)
- Tests that involve email verification will need a test email strategy (test mailbox or bypassed verification in staging)
- Admin tests require a seeded admin user in the test environment
- AI-dependent tests (chat, image enhancement) should mock external APIs or use a dedicated test budget
- Do not run E2E tests against production to avoid creating test data in the live database
