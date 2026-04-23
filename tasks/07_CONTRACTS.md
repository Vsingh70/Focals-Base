# Task 15 — Contracts Module (NEW FEATURE)

## Goal
A contract system with reusable templates, merge tag auto-fill from project/client data, per-project custom fields, and PDF export.

---

## Architecture

```
contract_templates (reusable base text with merge tags)
         │
         ▼
contracts (rendered instance linked to project + client)
         │
         ├── auto-filled from project/client data
         ├── custom fields per project
         └── exported as PDF
```

---

## 1. Merge Tag System

Templates use `{{merge_tags}}` that are auto-replaced when a contract is created from a template.

### Available Merge Tags

| Tag | Source |
|---|---|
| `{{client_name}}` | clients.full_name |
| `{{client_email}}` | clients.email |
| `{{client_phone}}` | clients.phone |
| `{{shoot_date}}` | projects.shoot_date |
| `{{shoot_location}}` | projects.location |
| `{{package_price}}` | projects.package_price |
| `{{photographer_name}}` | profiles.full_name |
| `{{business_name}}` | profiles.business_name |
| `{{contract_date}}` | contracts.created_at (today) |
| `{{project_title}}` | projects.title |
| `{{balance_due}}` | projects.package_price - projects.amount_paid |

---

## 2. Template Editor `/contracts/templates`

- List of saved templates
- Create/edit template with a rich text area
- Merge tag helper panel — click to insert tag at cursor
- Preview mode — render with sample data
- Default starter template included on first use (photography session agreement)

### Default Starter Template

```
PHOTOGRAPHY SERVICES AGREEMENT

This agreement is between {{photographer_name}} ("Photographer") and {{client_name}} ("Client").

SESSION DETAILS
Date: {{shoot_date}}
Location: {{shoot_location}}
Package: {{project_title}}
Total Investment: {{package_price}}
Balance Due: {{balance_due}}

PAYMENT TERMS
A non-refundable deposit is due upon signing. The remaining balance of {{balance_due}} is due on or before the session date.

CANCELLATION POLICY
Cancellations made less than 48 hours before the session will forfeit the deposit. Rescheduling is available once at no charge with at least 48 hours notice.

USAGE RIGHTS
Photographer retains the right to use images for portfolio and marketing purposes unless otherwise agreed in writing.

SIGNATURES
Client: _________________________ Date: _____________
Photographer: ___________________ Date: _____________
```

---

## 3. Contract Instance Creation

When creating a contract from a template:

1. User selects template → selects project → selects client
2. System auto-fills all merge tags from DB
3. User reviews rendered contract
4. User can add custom fields (key-value pairs stored in `custom_fields` JSONB)
5. Custom fields can be inserted as additional sections below the template body
6. Save as draft or mark as sent

```typescript
// lib/actions/contracts.ts
export async function renderContract(
  templateId: string,
  projectId: string,
  clientId: string,
  customFields: Record<string, string>
): Promise<ActionResult<string>> {
  // Fetch template, project, client, profile in parallel
  const [template, project, client, profile] = await Promise.all([...])

  let body = template.body
  const tags: Record<string, string> = {
    client_name: client.full_name,
    client_email: client.email ?? '',
    shoot_date: formatDate(project.shoot_date),
    shoot_location: project.location ?? '',
    package_price: formatCurrency(project.package_price),
    balance_due: formatCurrency(project.package_price - project.amount_paid),
    photographer_name: profile.full_name,
    business_name: profile.business_name ?? '',
    contract_date: formatDate(new Date()),
    project_title: project.title,
    ...customFields,
  }

  for (const [key, value] of Object.entries(tags)) {
    body = body.replaceAll(`{{${key}}}`, value)
  }

  return { data: body, error: null }
}
```

---

## 4. Contracts List `/contracts`

- Table: Contract name | Client | Project | Status | Created | Actions
- Status badges: Draft (grey) | Sent (blue) | Signed (green) | Void (red)
- Click row → contract detail page

---

## 5. Contract Detail Page `/contracts/[id]`

- Full rendered contract body (read-only view after creation)
- Metadata: client, project, template used, dates
- Custom fields section if present
- Status update buttons: Mark as Sent | Mark as Signed | Void
- **Export as PDF** button

---

## 6. PDF Export

Use `@react-pdf/renderer` to generate a clean PDF:

```typescript
// lib/pdf/contract.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export function ContractPDF({ contract, profile }: ContractPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{profile.business_name}</Text>
        </View>
        <Text style={styles.title}>{contract.title}</Text>
        <Text style={styles.body}>{contract.body}</Text>
      </Page>
    </Document>
  )
}
```

Create a `/api/contracts/[id]/pdf` route that streams the PDF response.

---

## Acceptance Criteria
- [ ] Template editor with merge tag helper panel
- [ ] Default starter template created on first use
- [ ] All merge tags auto-filled correctly from DB
- [ ] Custom fields can be added per contract instance
- [ ] Contract status lifecycle: draft → sent → signed / void
- [ ] PDF export downloads a clean, formatted PDF
- [ ] Contracts linked to projects show in project detail panel
- [ ] Zero merge tags left un-replaced in rendered output (validate before save)
