# Schema Mapping: Postgres → Swift

Source of truth: `my-app/src/lib/supabase/types.ts`
Last synced: 2026-04-29

When a snapshot test fails after a web schema change, update the Swift struct and this file.

---

## profiles

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| full_name | fullName | String? |
| email | email | String? |
| avatar_url | avatarUrl | String? |
| business_name | businessName | String? |
| website | website | String? |
| instagram_handle | instagramHandle | String? |
| calendar_token | calendarToken | String |
| tutorial_progress | tutorialProgress | TutorialProgress |
| created_at | createdAt | Date |
| updated_at | updatedAt | Date |

## clients

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| full_name | fullName | String |
| email | email | String? |
| phone | phone | String? |
| notes | notes | String? |
| source | source | String? |
| created_at | createdAt | Date |
| updated_at | updatedAt | Date |

## projects

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| title | title | String |
| client_id | clientId | UUID? |
| category | category | String? |
| status | status | ProjectStatus? |
| shoot_date | shootDate | Date? (timestamptz) |
| location | location | String? |
| package_price | packagePrice | Double? |
| amount_paid | amountPaid | Double? |
| payment_status | paymentStatus | PaymentStatus? |
| notes | notes | String? |
| created_at | createdAt | Date |
| updated_at | updatedAt | Date |

## contracts

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| title | title | String |
| body | body | String |
| status | status | ContractStatus? |
| template_id | templateId | UUID? |
| project_id | projectId | UUID? |
| client_id | clientId | UUID? |
| custom_fields | customFields | [String: String]? |
| sent_at | sentAt | Date? |
| signed_at | signedAt | Date? |
| created_at | createdAt | Date |
| updated_at | updatedAt | Date |

## contract_templates

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| name | name | String |
| body | body | String |
| created_at | createdAt | Date |
| updated_at | updatedAt | Date |

## forms

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| name | name | String |
| fields | fields | [FormField] |
| created_at | createdAt | Date |
| updated_at | updatedAt | Date |

## inquiries

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| name | name | String |
| email | email | String? |
| phone | phone | String? |
| shoot_type | shootType | String? |
| preferred_date | preferredDate | String? |
| message | message | String? |
| source | source | String |
| source_handle | sourceHandle | String? |
| status | status | InquiryStatus? |
| raw_payload | rawPayload | AnyCodable? |
| converted_client_id | convertedClientId | UUID? |
| converted_project_id | convertedProjectId | UUID? |
| created_at | createdAt | Date |
| updated_at | updatedAt | Date |

## inquiry_sources

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| label | label | String |
| type | type | String |
| is_active | isActive | Bool? |
| config | config | AnyCodable? |
| created_at | createdAt | Date |

Note: no `updated_at` column.

## finances

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| type | type | FinanceType |
| amount | amount | Double |
| date | date | String |
| category | category | String? |
| description | description | String? |
| payment_method | paymentMethod | String? |
| project_id | projectId | UUID? |
| created_at | createdAt | Date |

Note: no `updated_at` column.

## gear

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| name | name | String |
| category | category | String? |
| brand | brand | String? |
| model | model | String? |
| serial_number | serialNumber | String? |
| purchase_price | purchasePrice | Double? |
| purchase_date | purchaseDate | String? |
| status | status | GearStatus? |
| notes | notes | String? |
| created_at | createdAt | Date |

Note: no `updated_at` column.

## links

| Postgres column | Swift property | Type |
|---|---|---|
| id | id | UUID |
| user_id | userId | UUID |
| title | title | String |
| url | url | String |
| category | category | String? |
| notes | notes | String? |
| created_at | createdAt | Date |

Note: no `updated_at` column.

---

## Status Enums

| Enum | Values (from web Zod validations) |
|---|---|
| ProjectStatus | inquiry, booked, in_progress, editing, delivered, completed, cancelled |
| PaymentStatus | unpaid, partial, paid |
| InquiryStatus | new, read, replied, converted, archived |
| ContractStatus | draft, sent, signed, void |
| FinanceType | income, expense |
| GearStatus | owned, wishlist, sold, rented |
| FormFieldType | text, date, currency, contact, checkbox |
