# Grub Shala POS

## Current State
POSScreen.tsx handles order placement. On success, shows a 3-second success animation then resets. No print functionality exists.

## Requested Changes (Diff)

### Add
- `PrintReceiptModal` component: shows receipt preview with outlet name, customer name/mobile, order items, subtotal, tax, total, and timestamp
- Print via browser `window.print()` with receipt CSS (works for USB/network thermal printers and regular printers)
- Print via Web Bluetooth API with ESC/POS commands for Bluetooth thermal printers (58mm/80mm)
- After successful order placement, show receipt modal with both print options
- A `usePrintReceipt` hook that encapsulates both print strategies

### Modify
- `POSScreen.tsx`: capture last placed order data, show PrintReceiptModal after success
- `handlePlaceOrder`: store order receipt data on success, open modal

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/pos/PrintReceiptModal.tsx` with receipt UI and dual print options
2. Modify `POSScreen.tsx` to track last order data and open print modal after success
