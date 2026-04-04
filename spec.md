# Grub Shala POS

## Current State
The app uses Internet Identity (ICP) for admin authentication. There is one admin assigned via the "Claim Admin Access" first-run flow. The backend has `assignCallerUserRole(user: Principal, role: UserRole)` which allows an existing admin to grant any ICP principal admin rights. There is no UI to manage additional admins.

## Requested Changes (Diff)

### Add
- New "Admins" tab in the admin panel sidebar/bottom nav
- New `AdminsTab` component that:
  - Lists all current admins (principals with their roles from the backend)
  - Allows adding a new admin by pasting their ICP Principal ID
  - Shows the current logged-in user's own Principal ID (so they can share it with others to be added as admin)
  - Confirmation toast on success/error
- New backend function `getAdmins()` that returns all principals with admin role
- New query hook `useAdmins()` and mutation hook `useAddAdmin()`

### Modify
- `AdminPanel.tsx`: add "Admins" tab to nav items and render `AdminsTab`
- `main.mo`: add `getAdmins()` function that returns all admin principals
- `useQueries.ts`: add `useAdmins()` and `useAddAdmin()` hooks
- `backend.d.ts`: add `getAdmins()` to the interface

### Remove
- Nothing

## Implementation Plan
1. Add `getAdmins()` to `main.mo` — returns `[(Principal, Text)]` (principal + role text)
2. Update `backend.d.ts` to expose `getAdmins()`
3. Create `AdminsTab.tsx` with:
   - Current user's principal displayed (copyable)
   - List of current admins
   - Form to add new admin by Principal ID
4. Update `useQueries.ts` with `useAdmins()` query and `useAddAdmin()` mutation
5. Update `AdminPanel.tsx` to include the new tab

**Note on Google email:** ICP uses Principal IDs (not email addresses) for identity. The user wanting to become admin must share their ICP Principal ID with the existing admin. The UI will show the current user's principal prominently to facilitate this workflow.
