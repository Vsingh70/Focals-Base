# Task 16 — Remaining Modules: Gear, Forms, Links

---

## Gear Module `/gear`

### Features
- Grid or list toggle view
- Cards: gear name, brand/model, category icon, status badge, purchase price
- Filter by: category, status (owned / wishlist / sold)
- Add/edit gear modal with all fields
- Total gear value computed from owned items

### Status Badges
- `owned` → green
- `wishlist` → blue
- `sold` → muted
- `rented` → yellow

---

## Forms Module `/forms`

Dynamic form builder (existing feature — redesign UI only, keep logic).

### Features
- List of saved forms
- Form builder: drag-and-drop field ordering, field types: Text | Date | Currency | Contact | Checkbox
- System fields always present: Name, Date, Category (required), Pay, Expenses (optional)
- Up to 10 custom fields
- Up to 3 hover preview fields per row
- Form submissions stored (future feature — scaffold the table now)

---

## Links Module `/links`

### Features
- Grid of link cards: title, URL, category tag, notes
- Click card → opens URL in new tab
- Add/edit/delete links
- Filter by category
- Category suggestions: Inspiration, Client, Reference, Tool, Tutorial, Other

---

# Task 17 — Settings Module `/settings`

## Sections

### Profile
- Full name, business name, email (read-only from auth), avatar upload
- Website URL, Instagram handle

### Integrations
Three sub-sections:

**Inquiry Sources**
- List of connected sources (website forms, email addresses)
- Add new source: choose type (Website / Email / Instagram), add label
- Copy embed snippet / webhook URL per source
- Toggle active/inactive per source

**Calendar Sync**
- Current feed URL (masked with copy button)
- "Add to Apple Calendar" (webcal:// link)
- "Add to Google Calendar" (Google subscribe deep link)
- Regenerate token (with confirmation warning)

**Future Integrations** (scaffold UI, not functional)
- Instagram DM (Coming soon badge)
- Stripe payments (Coming soon badge)
- HoneyBook sync (Coming soon badge)

### Appearance
- Dark / Light / System theme toggle
- Accent color picker (5 preset options)

### Account
- Sign out button
- Delete account (destructive, with confirmation modal)

---

## Acceptance Criteria (all remaining modules)
- [ ] Gear CRUD with status tracking and total value display
- [ ] Forms builder preserves existing logic with redesigned UI
- [ ] Links module with category filtering
- [ ] Settings profile updates persist to `profiles` table
- [ ] Inquiry sources UI shows embed snippets and webhook URLs
- [ ] Calendar sync section shows correct feed URL with regenerate
- [ ] Theme toggle works and persists via localStorage
- [ ] Account deletion clears all user data (cascade via DB foreign keys)
