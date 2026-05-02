# Task 4-5: Global Search and Data Export (CSV)

## Work Summary

### Part A: Global Search API
**Created:** `/home/z/my-project/src/app/api/search/route.ts`
- GET endpoint searching across products, orders, and customers
- Query params: `storeId` (required), `q` (search query), `limit` (default 10)
- Search logic:
  - Products: name, sku, description (using Prisma `contains`)
  - Orders: orderNumber, customerName, customerEmail
  - Customers: name, email, phone
- Auth check via `getCurrentUser()` from `@/lib/auth`
- Store ownership verification before searching

### Part B: Global Search UI (Command Palette)
**Created:** `/home/z/my-project/src/components/layout/GlobalSearch.tsx`
- Command palette dialog using shadcn/ui `CommandDialog` component
- Triggered via `open` / `onOpenChange` props from parent
- Features:
  - Search input at top with debounced search (300ms)
  - Results grouped by type: Products, Orders, Customers
  - Each result shows relevant info (name, price, SKU for products; order #, customer, total for orders; name, email, orders for customers)
  - Clicking navigates to that view using Zustand store actions
  - "No results found" state when query returns nothing
  - Quick action items when no query: "Go to Products", "Go to Orders", "Go to Customers", "Go to Analytics", "Go to Settings"
  - Loading state with spinner
  - Color-coded icons: emerald for products, blue for orders, violet for customers

### Part C: Data Export API
**Created:** `/home/z/my-project/src/app/api/export/route.ts`
- GET endpoint that exports data as CSV
- Query params: `storeId` (required), `type` (products|orders|customers)
- Returns CSV with `Content-Type: text/csv` and `Content-Disposition: attachment` headers
- CSV columns by type:
  - Products: Name, SKU, Price, Compare Price, Cost, Category, Stock, Status, Featured
  - Orders: Order Number, Customer Name, Customer Email, Total, Status, Payment Status, Fulfillment Status, Date
  - Customers: Name, Email, Phone, City, State, Total Orders, Total Spent, Created Date
- Proper CSV escaping (commas, quotes, newlines)
- Auth check via `getCurrentUser()`

### Part D: DashboardLayout Integration
**Modified:** `/home/z/my-project/src/components/layout/DashboardLayout.tsx`
- Imported `GlobalSearch` component
- Added `searchOpen` state
- Added keyboard shortcut listener: Cmd+K / Ctrl+K toggles the search dialog
- Made the search bar in the header clickable (opens command palette)
- Set the search input as `readOnly` with `pointer-events-none` so clicking the wrapper opens the dialog
- Rendered `<GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />` at bottom of component

### Part E: Export Buttons
**Modified:** Three page components to add CSV export buttons:

1. **ProductsPage.tsx**: Added `Download` icon import, wrapped "Add Product" and "Export" buttons in flex container, export button uses `window.open(/api/export?storeId=...&type=products)`

2. **OrdersPage.tsx**: Added `Download` icon import, wrapped "Create Order" and "Export" buttons in flex container, export button uses `type=orders`

3. **CustomersPage.tsx**: Added `Download` icon import, wrapped "Add Customer" and "Export" buttons in flex container, export button uses `type=customers`

### Lint Results
- 0 errors, 1 warning (pre-existing unrelated warning in discounts API)
- Dev server compiling successfully

### Files Created
- `/home/z/my-project/src/app/api/search/route.ts`
- `/home/z/my-project/src/app/api/export/route.ts`
- `/home/z/my-project/src/components/layout/GlobalSearch.tsx`

### Files Modified
- `/home/z/my-project/src/components/layout/DashboardLayout.tsx`
- `/home/z/my-project/src/components/products/ProductsPage.tsx`
- `/home/z/my-project/src/components/orders/OrdersPage.tsx`
- `/home/z/my-project/src/components/customers/CustomersPage.tsx`
