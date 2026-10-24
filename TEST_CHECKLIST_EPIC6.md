# Epic 6 acceptance checklist

- [ ] Admin can create a PERCENTAGE voucher with maximum discount, minimum order, dates, and usage limit.
- [ ] Admin can create a FIXED-amount voucher.
- [ ] Duplicate code is rejected.
- [ ] Percentage value above 100 and negative amounts are rejected.
- [ ] End date must be after start date.
- [ ] `usageLimit = 0` means unlimited; otherwise application is rejected after limit reached.
- [ ] Voucher cannot be used before start date, after expiry, while inactive, or below minimum order.
- [ ] Admin can edit voucher conditions without modifying `usedCount` directly.
- [ ] Admin can delete a voucher after confirmation.
- [ ] Creating an active voucher sends one notification visible under the customer notification bell.
- [ ] An active voucher within 3 days of expiry generates one reminder only, not one per polling request.
- [ ] Customer voucher card displays remaining uses when limited and marks near-expiry vouchers.
- [ ] Cart and checkout apply only vouchers validated by the server.
