# Grub Shala POS

## Current State
Customers are stored in the backend keyed by mobile number. The Customers tab in the admin panel displays a table with mobile and name, plus a CSV download. There is no way to delete a customer.

## Requested Changes (Diff)

### Add
- `deleteCustomer(mobile: Text)` backend function (admin-only) that removes a customer by mobile
- Delete button per customer row in CustomersTab.tsx with confirmation before deletion

### Modify
- `backend.d.ts` — add `deleteCustomer(mobile: string): Promise<boolean>`
- `CustomersTab.tsx` — add Actions column with trash/delete button per row

### Remove
Nothing removed.

## Implementation Plan
1. Add `deleteCustomer` to main.mo (admin-only)
2. Add `deleteCustomer` to backend.d.ts
3. Update CustomersTab.tsx to add delete button with confirmation dialog
