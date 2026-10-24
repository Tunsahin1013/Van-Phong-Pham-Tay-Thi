# Epic 6 — Khuyến mãi & Voucher (US39–US41)

## Files in this patch
- `controllers/voucherController.ts` — server-side voucher validation, date/usage conditions, new-voucher notification.
- `controllers/notificationController.ts` — one-time near-expiry notification generation when a signed-in user requests notifications.
- `data/seedData.ts` — optional voucher marker used to prevent duplicate expiry notices.
- `src/pages/admin/AdminDashboard.tsx` — Admin create/edit/delete voucher form and condition fields.
- `src/pages/customer/VouchersPage.tsx` — displays remaining usage count and a near-expiry indicator.

## User stories
### US39: Create discount voucher
Admins can create a percentage or fixed-amount voucher. Codes are uppercased and duplicate codes are rejected. Percentage discounts must be 1–100.

### US40: Voucher conditions
Supports minimum order amount, maximum discount for percentage vouchers, start/end time, usage limit, and active/inactive status. `usageLimit = 0` means unlimited. The server validates the combined voucher record on create/update and checks dates/usage/minimum order again when a voucher is applied.

### US41: Customer notifications
- Creating an ACTIVE voucher broadcasts a `VOUCHER` notification to `ALL`, linked to `/vouchers`.
- When an ACTIVE voucher is within the next 3 days of expiry, `GET /api/notifications` creates one reminder for it and records `expiryNoticeSentAt` to avoid repeated broadcasts.
- The existing notification context polls every 30 seconds for authenticated users.

## Apply
Back up the project or commit current changes first. Extract the ZIP into the repository root and preserve the folder structure, then run:

```powershell
npm run lint
npm run build
```

This patch is an overlay for the project snapshot used during implementation. Compare the included files with your current branch before overwriting if your files have changed since that snapshot.

## Verification notes
- `npm run lint` passes on the source snapshot used to prepare the patch.
- `npm run build` could not be verified in this container because the installed Rolldown package is missing its Linux native binding. Run build on the Windows development machine before committing.
- The project snapshot uses `DataStoreService` with JSON-file persistence. Verify the deployed environment's persistence configuration before relying on notification durability on Vercel.
