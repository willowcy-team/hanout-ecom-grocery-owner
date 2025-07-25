# Grocery Admin Dashboard

This is the admin panel for the grocery ordering system, separated from the main user application.

## Features

- Product management (add, edit, delete products)
- Category and subcategory management
- Order management and tracking
- Customer management
- Dashboard with analytics

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.local` and update with your Supabase credentials.

3. Run the development server:
```bash
npm run dev
```

The admin panel will be available at [http://localhost:3001](http://localhost:3001).

## Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3001
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

## Architecture

This admin app is completely separate from the main user application and includes:

- All necessary UI components
- Admin-specific layouts
- Product, category, and order management APIs
- Independent build and deployment pipeline

## Port Configuration

The admin app runs on port 3001 by default to avoid conflicts with the main user app (port 3000).