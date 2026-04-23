# Task 03 — Authentication

## Goal
Implement Supabase Auth with Google OAuth. Protect all dashboard routes. Create a clean login page.

---

## Login Page `/login`

- Single centered card, dark background
- "[APP_NAME]" wordmark at top using `--font-display`
- "Continue with Google" button (primary CTA)
- No username/password form — Google OAuth only
- On success → redirect to `/`

```typescript
// app/(auth)/login/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const signIn = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/auth/callback` }
  })
  return (/* clean login UI */)
}
```

## Auth Callback Route

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
    // Upsert profile row on first login
  }
  return NextResponse.redirect(new URL('/', request.url))
}
```

## Profile Auto-Creation

On first OAuth login, upsert a row in `profiles` using the user's Google name and email.

---

## Acceptance Criteria
- [ ] Google OAuth login works end-to-end
- [ ] Auth callback upserts profile row
- [ ] Unauthenticated users redirected to `/login`
- [ ] Authenticated users redirected away from `/login`
- [ ] Sign out clears session and redirects to `/login`

---

# Task 04 — API Layer (Server Actions)

## Goal
All data mutations go through typed Next.js Server Actions with Zod validation. No raw Supabase calls from client components.

## Pattern

```typescript
// lib/actions/projects.ts
'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResult<T> = { data: T; error: null } | { data: null; error: string }

const CreateProjectSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  client_id: z.string().uuid().optional(),
  shoot_date: z.string().optional(),
  package_price: z.number().optional(),
})

export async function createProject(
  input: z.infer<typeof CreateProjectSchema>
): Promise<ActionResult<Project>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const parsed = CreateProjectSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.message }

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/projects')
  return { data, error: null }
}
```

## Required Server Actions per Module

| Module | Actions |
|---|---|
| projects | createProject, updateProject, deleteProject, listProjects |
| clients | createClient, updateClient, deleteClient, listClients |
| shoots | createShoot, updateShoot, deleteShoot, listShoots |
| finances | createTransaction, updateTransaction, deleteTransaction, listTransactions |
| gear | createGearItem, updateGearItem, deleteGearItem, listGear |
| inquiries | createInquiry (public), updateInquiryStatus, convertInquiryToClient, listInquiries |
| contracts | createTemplate, updateTemplate, createContract, renderContract, updateContractStatus |

## Acceptance Criteria
- [ ] All mutations use Server Actions — zero direct Supabase calls from client components
- [ ] Every action validates with Zod before hitting DB
- [ ] `user_id` always set from server session — never from client input
- [ ] All list actions support pagination (`page`, `limit` params)
- [ ] `revalidatePath` called after every mutation
- [ ] Consistent `ActionResult<T>` return type across all actions
