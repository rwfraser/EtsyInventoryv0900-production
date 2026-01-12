# Gemstone Earrings E-commerce Website

A modern, fully-featured e-commerce website showcasing 254 unique gemstone earring combinations with premium sterling silver settings.

## Features

- **254 Unique Products**: Browse an extensive collection of earring designs
- **Advanced Filtering**: Filter by color, shape, size, and material
- **Sorting Options**: Sort by price or name
- **Shopping Cart**: Full cart functionality with localStorage persistence
- **Product Details**: Detailed pages for each earring pair with complete specifications
- **Responsive Design**: Mobile-friendly layout using Tailwind CSS
- **Modern Tech Stack**: Built with Next.js 15, TypeScript, and React

## Getting Started

### Start the Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
gemstone-earrings/
├── app/                      # Next.js 15 app directory
│   ├── layout.tsx           # Root layout with CartProvider
│   ├── page.tsx             # Homepage
│   ├── products/            
│   │   ├── page.tsx         # Product listing with filters
│   │   └── [id]/
│   │       └── page.tsx     # Individual product detail page
│   └── cart/
│       └── page.tsx         # Shopping cart page
├── components/
│   ├── Header.tsx           # Navigation header with cart
│   └── ProductCard.tsx      # Reusable product card component
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   ├── products.ts          # Product data utilities
│   └── CartContext.tsx      # Shopping cart state management
└── public/
    └── products.json        # Product data (254 earring pairs)
```

## Pages

### Homepage (/)
- Hero section with call-to-action
- Featured products showcase
- Key features highlight

### Products Listing (/products)
- All 254 products with sidebar filters
- Filter by: color, shape, size, material
- Sorting options: price, name

### Product Detail (/products/[id])
- Complete gemstone & setting specifications
- Price breakdown
- Add to cart with quantity selector

### Shopping Cart (/cart)
- Cart management with quantity controls
- Order summary
- Persistent cart (localStorage)

## Technologies

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- React Context API
- localStorage for cart persistence

## Data Source

Product data sourced from:
- Gemstones: Otto Frei (ottofrei.com)
- Settings: DIY Jewelry Supply (diyjewelry.us)
