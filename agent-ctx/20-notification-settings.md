# Task 20 - Notifications Tab in Store Settings

## Task
Add a "Notifications" tab to Store Settings where merchants can configure their email notification preferences.

## Work Completed

### 1. Prisma Schema Update
- Added `NotificationPreference` model to `/home/z/my-project/prisma/schema.prisma` with all required fields:
  - id, storeId (unique), newOrderEmail, orderStatusEmail, paymentReceivedEmail, lowStockEmail, lowStockThreshold, reviewEmail, abandonedCartEmail, abandonedCartReminderDelay, weeklyReportEmail, monthlyReportEmail, newsletterEmail, reportEmail, createdAt, updatedAt
- Added `notificationPreference NotificationPreference?` relation to Store model
- Ran `bun run db:push` successfully

### 2. API Route
- Created `/home/z/my-project/src/app/api/notification-preferences/route.ts`:
  - GET: Fetches preferences for a store (creates default if not exists), with ownership verification
  - PUT: Updates preferences with upsert pattern and ownership verification

### 3. StoreSettings Component Update
- Updated `/home/z/my-project/src/components/store/StoreSettings.tsx`:
  - Added NotificationPreferences interface
  - Added Bell, ShoppingCart, Package, Star, FileText, Mail icon imports
  - Added state: notifPrefs, notifLoading, notifSaving, debounceTimer
  - Added fetchNotificationPrefs callback (loads on tab switch)
  - Added saveNotificationPref callback with toast
  - Added handleNotifChange with 500ms debounce auto-save
  - Added "Notifications" tab trigger (between Regional and Danger Zone, 6-column grid)
  - Added Notifications TabsContent with 4 cards:
    - **Order Notifications**: newOrderEmail, orderStatusEmail, paymentReceivedEmail switches
    - **Inventory Alerts**: lowStockEmail switch, conditional lowStockThreshold number input
    - **Marketing & Reviews**: reviewEmail switch, abandonedCartEmail switch, conditional abandonedCartReminderDelay input
    - **Reports**: weeklyReportEmail switch, monthlyReportEmail switch, reportEmail email input, newsletterEmail switch
  - Loading skeletons, saving indicator, and empty state included

### 4. Quality
- `bun run lint` passes with 0 errors
- Dev server compiles successfully
